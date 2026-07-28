import assert from "assert";
import { generateKeyPairSync } from "crypto";
import type Redis from "ioredis";

const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
});

Object.assign(process.env, {
    type: "service_account",
    project_id: "payload-invariance",
    private_key_id: "payload-invariance",
    private_key: privateKey,
    client_email: "payload-invariance@payload-invariance.iam.gserviceaccount.com",
    client_id: "0",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://example.invalid",
    universe_domain: "googleapis.com",
    redis_ip: "127.0.0.1",
    mode: "local",
});

const stable = (docs: any[]) => docs.map((d) => JSON.stringify(d, Object.keys(d).sort())).sort();

/// ── implementations exactly as they were before the HASH migration ──

const legacy_scan = async (pattern: string, commander: Redis): Promise<string[]> => {
    const found_keys: string[] = [];
    let cursor = "0";
    do {
        const [next_cursor, keys] = await commander.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = next_cursor;
        found_keys.push(...keys);
    } while (cursor !== "0");
    return found_keys;
};

const legacy_parse_redis_value = (raw: string) => {
    const parsed = JSON.parse(raw);
    return parsed.data ?? parsed;
};

/// data-socket send_initial_collection_data + snapshot.ts get_collection_data
const legacy_initial_payload = async (collection: string, commander: Redis) => {
    const keys = await legacy_scan(`${collection}:*`, commander);
    if (keys.length === 0) return [];
    const values = await commander.mget(keys);
    return values.filter(Boolean).map((v: any) => JSON.parse(v).data);
};

/// data-socket on_get_data, unkeyed branch
const legacy_get_data_payload = async (collection: string, commander: Redis) => {
    const keys = await legacy_scan(`${collection}:*`, commander);
    if (!keys || keys.length === 0) return [];
    const raw_values = await commander.mget(keys);
    return raw_values.map((raw: string | null) => (raw ? JSON.parse(raw)?.data || null : null)).filter((item: any) => item !== null);
};

/// server_commons get_all_collection_docs
const legacy_all_collection_docs = async (collection: string, commander: Redis) => {
    const keys = await legacy_scan(`${collection}:*`, commander);
    if (keys.length === 0) return [];
    const values = await commander.mget(keys);
    return values.filter(Boolean).map((v) => {
        const data = legacy_parse_redis_value(v!);
        const key = keys[values.indexOf(v)];
        const id = key.split(":").slice(1).join(":");
        return { ...data, id };
    });
};

/// server_commons redis_get_document_by_id
const legacy_document_by_id = async (collection: string, doc_id: string, commander: Redis) => {
    const raw = await commander.get(`${collection}:${doc_id}`);
    if (!raw) throw "Document not found in Redis, document id: " + doc_id;
    return legacy_parse_redis_value(raw);
};

const run = async () => {
    const {
        init_redis,
        get_redis_commander,
        write_doc,
        read_collection,
        read_doc,
        redis_get_all_documents,
        redis_get_document_by_id,
        redis_query_document,
        redis_query_documents,
    } = await import("./src/helpers");
    const { cache_manager } = await import("./src/managers");

    cache_manager.setObjectData("nx-settings", {
        cache_collections_config: {
            units: {},
            last_locations: { key: "car_number" },
        },
    });

    await init_redis();
    const commander = get_redis_commander();
    if (commander.status !== "ready") {
        await new Promise((resolve) => commander.once("ready", resolve));
    }
    await commander.flushdb();

    /// units — keyed by id, the standard shape
    const units = Array.from({ length: 300 }, (_, i) => ({
        id: `car-${i}`,
        car_number: `${1000000 + i}`,
        client_id: i % 3 === 0 ? "client-a" : "client-b",
        nickname: `car ${i}`,
        nested: { level: { value: i } },
    }));

    /// last_locations — keyed by car_number, NOT by id. the collection that would break a blanket id rule
    const last_locations = units.map((car) => ({
        car_number: car.car_number,
        lat: 32 + Number(car.id.split("-")[1]) / 1000,
        lng: 34.8,
        speed: 0,
    }));

    const envelope = (collection_name: string, key: string, data: any) => ({
        key,
        collection_name,
        update_type: "add" as const,
        data,
        update_time: 1_700_000_000_000,
    });

    const seed = commander.pipeline();
    units.forEach((doc) => {
        const env = envelope("units", doc.id, doc);
        seed.set(`units:${doc.id}`, JSON.stringify(env));
        write_doc(seed, "units", doc.id, env);
    });
    last_locations.forEach((doc) => {
        const env = envelope("last_locations", doc.car_number, doc);
        seed.set(`last_locations:${doc.car_number}`, JSON.stringify(env));
        write_doc(seed, "last_locations", doc.car_number, env);
    });
    await seed.exec();

    for (const collection of ["units", "last_locations"]) {
        const legacy_keys = await legacy_scan(`${collection}:*`, commander);
        assert.strictEqual(
            await commander.hlen(collection),
            legacy_keys.length,
            `${collection}: hash field count must match the legacy string key count`
        );

        /// 1. initial:<collection> websocket frame
        const before_initial = await legacy_initial_payload(collection, commander);
        const after_initial = await read_collection(collection);
        assert.strictEqual(after_initial.length, before_initial.length, `${collection}: initial frame document count changed`);
        assert.deepStrictEqual(stable(after_initial), stable(before_initial), `${collection}: initial frame payload changed`);

        /// 2. on_get_data, unkeyed branch
        const before_get_data = await legacy_get_data_payload(collection, commander);
        assert.deepStrictEqual(stable(after_initial), stable(before_get_data), `${collection}: get_data payload changed`);

        /// 3. redis_get_all_documents
        const before_all = await legacy_all_collection_docs(collection, commander);
        const after_all = await redis_get_all_documents(collection);
        assert.strictEqual(after_all.length, before_all.length, `${collection}: redis_get_all_documents count changed`);
        assert.deepStrictEqual(stable(after_all), stable(before_all), `${collection}: redis_get_all_documents payload changed`);
    }

    /// 4. redis_get_document_by_id / read_doc, on both key shapes
    const before_unit = await legacy_document_by_id("units", "car-7", commander);
    assert.deepStrictEqual(await redis_get_document_by_id("units", "car-7"), before_unit, "redis_get_document_by_id changed for units");
    assert.deepStrictEqual(await read_doc("units", "car-7"), before_unit, "read_doc changed for units");

    const car_number = last_locations[7].car_number;
    const before_location = await legacy_document_by_id("last_locations", car_number, commander);
    assert.deepStrictEqual(
        await redis_get_document_by_id("last_locations", car_number),
        before_location,
        "redis_get_document_by_id changed for last_locations"
    );
    assert.strictEqual((before_location as any).id, undefined, "last_locations documents must not carry an injected id");

    /// 5. redis_query_* built on top of get_all_collection_docs
    const before_query_all = await legacy_all_collection_docs("units", commander);
    const before_query = before_query_all.filter((d) => d.car_number === units[9].car_number);
    assert.deepStrictEqual(
        await redis_query_document("units", "car_number", "==", units[9].car_number),
        before_query[0],
        "redis_query_document changed"
    );
    assert.deepStrictEqual(
        stable(await redis_query_documents("units", "client_id", "==", "client-a")),
        stable(before_query_all.filter((d) => d.client_id === "client-a")),
        "redis_query_documents changed"
    );

    /// 6. last_locations must keep its own key as the id when a caller asks for id_from_field
    const with_id = await read_collection("last_locations", { id_from_field: true });
    assert.ok(
        with_id.every((d) => d.id === d.car_number),
        "id_from_field on last_locations must use car_number, the configured key"
    );

    /// 7. no legacy path: with the hash gone, readers must return nothing even though the string keys still exist
    await commander.del("units");
    assert.strictEqual(await commander.hlen("units"), 0, "units hash should be empty for the no-legacy check");
    assert.ok((await legacy_scan("units:*", commander)).length > 0, "the legacy string keys must still be present for this check to mean anything");
    assert.deepStrictEqual(await redis_get_all_documents("units"), [], "readers must not fall back to the legacy string keys");
    assert.deepStrictEqual(await read_collection("units"), [], "read_collection must not fall back to the legacy string keys");
    await assert.rejects(() => redis_get_document_by_id("units", "car-7"), "read_doc must not fall back to the legacy string key");

    await commander.flushdb();
    console.log("✅ payload_invariance.check passed");
    process.exit(0);
};

run().catch((error) => {
    console.error("❌ payload_invariance.check failed");
    console.error(error);
    process.exit(1);
});
