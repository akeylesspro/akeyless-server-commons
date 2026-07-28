import assert from "assert";
import { generateKeyPairSync } from "crypto";

const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
});

Object.assign(process.env, {
    type: "service_account",
    project_id: "store-check",
    private_key_id: "store-check",
    private_key: privateKey,
    client_email: "store-check@store-check.iam.gserviceaccount.com",
    client_id: "0",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://example.invalid",
    universe_domain: "googleapis.com",
    redis_ip: "127.0.0.1",
    mode: "local",
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const envelope = (collection_name: string, key: string, data: any, update_time = Date.now()) => ({
    key,
    collection_name,
    update_type: "add" as const,
    data,
    update_time,
});

const run = async () => {
    const { init_redis, get_redis_commander, write_doc, remove_doc, read_doc, read_collection } = await import("./src/helpers");
    const { cache_manager } = await import("./src/managers");

    cache_manager.setObjectData("nx-settings", {
        cache_collections_config: {
            units: {},
            last_locations: { key: "car_number" },
            "big-coll": { is_big_collection: true },
            legacy: {},
            ttl_coll: {},
        },
    });

    await init_redis();
    const commander = get_redis_commander();
    if (commander.status !== "ready") {
        await new Promise((resolve) => commander.once("ready", resolve));
    }
    await commander.flushdb();

    /// 1. small collection, HGETALL path
    const batch = commander.pipeline();
    write_doc(batch, "units", "car-1", envelope("units", "car-1", { id: "car-1", plate: "111" }));
    write_doc(batch, "units", "car-2", envelope("units", "car-2", { id: "car-2", plate: "222" }));
    write_doc(batch, "units", "car-3", envelope("units", "car-3", { id: "car-3", plate: "333" }));
    await batch.exec();

    assert.strictEqual(await commander.hlen("units"), 3, "units hash should hold 3 fields");

    const units_default = await read_collection("units");
    assert.strictEqual(units_default.length, 3, "read_collection should return 3 docs");
    assert.deepStrictEqual(
        units_default.map((d) => d.plate).sort(),
        ["111", "222", "333"],
        "read_collection should return the envelope data untouched"
    );

    const units_with_id = await read_collection("units", { id_from_field: true });
    assert.ok(
        units_with_id.every((d) => d.id === d.plate.replace("111", "car-1").replace("222", "car-2").replace("333", "car-3")),
        "id_from_field should set id from the hash field name"
    );

    /// 2. custom-key collection (last_locations is keyed by car_number, not id)
    await commander.hset(
        "last_locations",
        "5555555",
        JSON.stringify(envelope("last_locations", "5555555", { car_number: "5555555", lat: 32.1, lng: 34.8 }))
    );
    const [ll_default] = await read_collection("last_locations");
    assert.deepStrictEqual(
        ll_default,
        { car_number: "5555555", lat: 32.1, lng: 34.8 },
        "default read must not inject an id into a custom-key collection"
    );
    const [ll_with_id] = await read_collection("last_locations", { id_from_field: true });
    assert.strictEqual(ll_with_id.id, "5555555", "id_from_field must use the hash field name");
    assert.strictEqual(ll_with_id.car_number, "5555555", "original fields must survive");

    /// 3. read_doc
    const doc = await read_doc("units", "car-2");
    assert.deepStrictEqual(doc, { id: "car-2", plate: "222" }, "read_doc should return envelope data");
    assert.strictEqual(await read_doc("units", "missing"), null, "read_doc should return null for a missing field");
    assert.strictEqual(await read_doc("no-such-collection", "x"), null, "read_doc should return null for a missing hash");
    assert.deepStrictEqual(await read_collection("no-such-collection"), [], "read_collection should return [] for a missing hash");

    /// 4. remove_doc, both on a pipeline and on the client directly
    const delete_batch = commander.pipeline();
    remove_doc(delete_batch, "units", "car-3");
    await delete_batch.exec();
    assert.strictEqual(await commander.hexists("units", "car-3"), 0, "remove_doc via pipeline should delete the field");
    await remove_doc(commander, "units", "car-2");
    assert.strictEqual(await commander.hexists("units", "car-2"), 0, "remove_doc via client should delete the field");
    await write_doc(commander, "units", "car-4", envelope("units", "car-4", { id: "car-4", plate: "444" }));
    assert.strictEqual(await commander.hexists("units", "car-4"), 1, "write_doc via client should create the field");

    /// 5. big collection, HSCAN path
    const big_batch = commander.pipeline();
    for (let i = 0; i < 2500; i++) {
        write_doc(big_batch, "big-coll", `doc-${i}`, envelope("big-coll", `doc-${i}`, { id: `doc-${i}`, n: i }));
    }
    await big_batch.exec();
    const big_docs = await read_collection("big-coll", { id_from_field: true });
    assert.strictEqual(big_docs.length, 2500, "HSCAN path should return every field");
    assert.strictEqual(new Set(big_docs.map((d) => d.id)).size, 2500, "HSCAN path should return distinct ids");

    /// 6. identical documents must still get distinct ids (the indexOf bug)
    const dup_batch = commander.pipeline();
    write_doc(dup_batch, "units", "dup-a", envelope("units", "dup-a", { plate: "same" }));
    write_doc(dup_batch, "units", "dup-b", envelope("units", "dup-b", { plate: "same" }));
    await dup_batch.exec();
    const dups = (await read_collection("units", { id_from_field: true })).filter((d) => d.plate === "same");
    assert.strictEqual(dups.length, 2, "both identical documents should be returned");
    assert.deepStrictEqual(dups.map((d) => d.id).sort(), ["dup-a", "dup-b"], "identical documents must get distinct ids");

    /// 7. legacy raw values (no envelope wrapper) must still parse
    await commander.hset("legacy", "plain-1", JSON.stringify({ id: "plain-1", plate: "999" }));
    assert.deepStrictEqual(await read_doc("legacy", "plain-1"), { id: "plain-1", plate: "999" }, "read_doc should tolerate un-enveloped values");
    assert.deepStrictEqual(await read_collection("legacy"), [{ id: "plain-1", plate: "999" }], "read_collection should tolerate un-enveloped values");

    /// 8. TTL
    const now = Date.now();
    write_doc(commander, "ttl_coll", "keep", envelope("ttl_coll", "keep", { id: "keep" }, now), { ttl_ms: 60_000 });
    await write_doc(commander, "ttl_coll", "expire", envelope("ttl_coll", "expire", { id: "expire" }, now), { ttl_ms: 120 });

    const stored = JSON.parse((await commander.hget("ttl_coll", "expire"))!);
    assert.strictEqual(stored.expires_at, now + 120, "write_doc should stamp expires_at = update_time + ttl_ms");
    const no_ttl = JSON.parse((await commander.hget("units", "car-4"))!);
    assert.strictEqual(no_ttl.expires_at, undefined, "write_doc without ttl_ms must not stamp expires_at");

    assert.deepStrictEqual(await read_doc("ttl_coll", "expire"), { id: "expire" }, "read_doc should return a document before it expires");
    assert.strictEqual((await read_collection("ttl_coll")).length, 2, "read_collection should return both documents before expiry");

    await sleep(200);
    assert.strictEqual(await read_doc("ttl_coll", "expire"), null, "read_doc should return null after expiry");
    await sleep(50);
    assert.strictEqual(await commander.hexists("ttl_coll", "expire"), 0, "read_doc should lazily HDEL the expired field");

    await write_doc(commander, "ttl_coll", "expire2", envelope("ttl_coll", "expire2", { id: "expire2" }, Date.now()), { ttl_ms: 100 });
    await sleep(200);
    const ttl_docs = await read_collection("ttl_coll");
    assert.deepStrictEqual(ttl_docs, [{ id: "keep" }], "read_collection should filter out expired documents");
    await sleep(50);
    assert.strictEqual(await commander.hexists("ttl_coll", "expire2"), 0, "read_collection should lazily HDEL expired fields");

    /// 9. hash key must not collide with the legacy STRING keyspace
    const units_before_legacy = (await read_collection("units")).length;
    await commander.set("units:legacy-string", JSON.stringify(envelope("units", "legacy-string", { id: "legacy-string" })));
    assert.strictEqual((await read_collection("units")).length, units_before_legacy, "legacy STRING keys must not leak into the hash read");
    assert.strictEqual(await commander.type("units"), "hash", "the collection key must be a hash");

    /// 10. round-trip count: one HGETALL for a small collection, zero SCAN
    const parse_command_stats = (raw: string): Record<string, number> => {
        const stats: Record<string, number> = {};
        raw.split("\n").forEach((line) => {
            const match = line.match(/^cmdstat_(\w+):calls=(\d+)/);
            if (match) {
                stats[match[1]] = Number(match[2]);
            }
        });
        return stats;
    };

    const rt_batch = commander.pipeline();
    for (let i = 0; i < 500; i++) {
        write_doc(rt_batch, "units", `rt-${i}`, envelope("units", `rt-${i}`, { id: `rt-${i}`, n: i }));
    }
    await rt_batch.exec();

    await commander.config("RESETSTAT");
    const rt_docs = await read_collection("units");
    const stats = parse_command_stats(await commander.info("commandstats"));
    assert.ok(rt_docs.length >= 500, "round-trip check should read the collection");
    assert.strictEqual(stats.hgetall, 1, `read_collection should issue exactly one HGETALL, got ${stats.hgetall}`);
    assert.strictEqual(stats.scan, undefined, "read_collection must not issue any SCAN");
    assert.strictEqual(stats.mget, undefined, "read_collection must not issue any MGET");
    assert.strictEqual(stats.hscan, undefined, "small collections must not use HSCAN");

    await commander.config("RESETSTAT");
    await read_collection("big-coll");
    const big_stats = parse_command_stats(await commander.info("commandstats"));
    assert.strictEqual(big_stats.hgetall, undefined, "big collections must not use HGETALL");
    assert.ok(big_stats.hscan >= 1, "big collections should use HSCAN");
    assert.strictEqual(big_stats.scan, undefined, "big collections must not issue any SCAN");
    console.log(`round trips -> small: HGETALL=1, big (2500 docs): HSCAN=${big_stats.hscan}`);

    await commander.flushdb();
    console.log("✅ store.check passed");
    process.exit(0);
};

run().catch((error) => {
    console.error("❌ store.check failed");
    console.error(error);
    process.exit(1);
});
