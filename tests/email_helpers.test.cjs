const assert = require("node:assert/strict");
const { test, beforeEach, mock } = require("node:test");
const nodemailer = require("nodemailer");
const sendgrid = require("@sendgrid/mail");
const create_real_transport = nodemailer.createTransport.bind(nodemailer);

let settings, smtp_result, smtp_error, sendgrid_result, sendgrid_error;
const smtp_options = [], google_messages = [], sendgrid_messages = [], api_keys = [], audits = [], logs = [], errors = [];

// Stub the barrels to avoid initializing Firebase or other services when loading this helper.
require.cache[require.resolve("../dist/cjs/helpers/index.js")] = {
    exports: {
        get_document_by_id: async (collection, id) => {
            assert.equal(collection, "nx-settings");
            assert.equal(id, "emails");
            return settings;
        },
        add_audit_record: async (...args) => audits.push(args),
    },
};
require.cache[require.resolve("../dist/cjs/managers/index.js")] = {
    exports: { logger: { log: (...args) => logs.push(args), error: (...args) => errors.push(args) } },
};
mock.method(sendgrid, "setApiKey", (key) => api_keys.push(key));
mock.method(sendgrid, "send", async (message) => {
    sendgrid_messages.push(message);
    if (sendgrid_error) throw sendgrid_error;
    return sendgrid_result;
});
mock.method(nodemailer, "createTransport", (options) => {
    smtp_options.push(options);
    return {
        sendMail: async (message) => {
            google_messages.push(message);
            if (smtp_error) throw smtp_error;
            return smtp_result;
        },
    };
});
const { send_email, send_email_google, create_attachment_from_buffer } = require("../dist/cjs/helpers/email_helpers.js");

const email = {
    to: "recipient@example.com",
    subject: "Email test",
    body_plain_text: "Hello",
    entity_for_audit: "email_test",
};

beforeEach(() => {
    settings = {
        sendgrid_api_key: "test-sendgrid-key",
        default_from: { email: "sendgrid@example.com", name: "Akeyless" },
        default_cc: ["default-cc@example.com"],
        groups: { team: { to: ["team@example.com"], cc: ["team-cc@example.com"] } },
    };
    smtp_result = { accepted: [email.to], rejected: [], messageId: "test-message" };
    sendgrid_result = [{ statusCode: 202, body: "" }, {}];
    smtp_error = sendgrid_error = undefined;
    for (const values of [smtp_options, google_messages, sendgrid_messages, api_keys, audits, logs, errors]) values.length = 0;
});

const use_google = () => {
    settings.provider = "google";
    settings.google = { email: "avraham@akeyless-sys.com", app_password: "abcd efgh ijkl mnop" };
    delete settings.sendgrid_api_key;
};

test("legacy settings keep SendGrid delivery, HTML priority, default CC and success audit", async () => {
    await send_email({ ...email, body_html: "<p>Hello</p>" }, { debug: true });
    assert.deepEqual(api_keys, ["test-sendgrid-key"]);
    assert.deepEqual(sendgrid_messages, [{
        subject: email.subject, from: settings.default_from, to: email.to,
        cc: settings.default_cc, html: "<p>Hello</p>",
    }]);
    assert.equal(smtp_options.length, 0);
    assert.deepEqual(audits[0].slice(0, 2), ["send_email", email.entity_for_audit]);
    assert.equal(logs.length, 1);
    assert.equal(errors.length, 0);
});

test("explicit SendGrid provider preserves groups, text and attachments", async () => {
    settings.provider = "sendgrid";
    const attachment = create_attachment_from_buffer(Buffer.from("file"), "test.txt", "text/plain");
    await send_email({ ...email, group_name: "team", cc: ["caller-cc@example.com"], attachments: [attachment] });
    assert.deepEqual(sendgrid_messages[0].to, ["team@example.com", email.to]);
    assert.deepEqual(sendgrid_messages[0].cc, ["caller-cc@example.com", ...settings.default_cc, "team-cc@example.com"]);
    assert.equal(sendgrid_messages[0].text, "Hello");
    assert.deepEqual(sendgrid_messages[0].attachments, [attachment]);
    assert.equal(google_messages.length, 0);
});

test("Google uses its configured mailbox, TLS and App Password without SendGrid credentials", async () => {
    use_google();
    await send_email(email, { debug: true });
    assert.deepEqual(smtp_options, [{
        host: "smtp.gmail.com", port: 465, secure: true,
        auth: { user: settings.google.email, pass: "abcdefghijklmnop" },
        disableFileAccess: true, disableUrlAccess: true,
    }]);
    assert.deepEqual(google_messages[0].from, { address: settings.google.email, name: "Akeyless" });
    assert.equal(google_messages[0].text, "Hello");
    assert.equal(sendgrid_messages.length, 0);
    assert.equal(api_keys.length, 0);
    assert.deepEqual(audits[0][2].from, { email: settings.google.email, name: "Akeyless" });
    const recorded = JSON.stringify({ audits, logs, errors });
    assert.ok(!recorded.includes(settings.google.app_password));
    assert.ok(!recorded.includes("abcdefghijklmnop"));
    assert.equal(errors.length, 0);
});

test("Google resolves groups, recipient arrays, caller CC and default CC without mutating input", async () => {
    use_google();
    const input = { ...email, to: [email.to, "second@example.com"], group_name: "team", cc: "caller-cc@example.com" };
    const original = structuredClone(input);
    await send_email(input);
    assert.deepEqual(google_messages[0].to, ["team@example.com", email.to, "second@example.com"]);
    assert.deepEqual(google_messages[0].cc, ["caller-cc@example.com", ...settings.default_cc, "team-cc@example.com"]);
    assert.deepEqual(input, original);
    await send_email({ ...email, to: undefined, group_name: "team" });
    assert.deepEqual(google_messages[1].to, ["team@example.com"]);
});

for (const from of ["alias@example.com", { email: "alias@example.com", name: "Alias" }]) {
    test(`Google preserves explicit ${typeof from} sender overrides`, async () => {
        use_google();
        await send_email({ ...email, from });
        assert.deepEqual(google_messages[0].from, typeof from === "string" ? from : { address: from.email, name: from.name });
    });
}

test("Google maps binary and inline attachments and the real library generates MIME", async () => {
    use_google();
    const binary = Buffer.from([0, 255, 128, 65]);
    const attachment = create_attachment_from_buffer(binary, "report.bin", "application/octet-stream");
    const inline = { ...create_attachment_from_buffer(Buffer.from("image"), "image.png", "image/png", "inline"), content_id: "logo" };
    await send_email({ ...email, subject: "בדיקת דואר", body_html: '<p>Hello</p><img src="cid:logo">', attachments: [attachment, inline] });
    const message = google_messages[0];
    assert.equal(message.text, undefined);
    assert.deepEqual(message.attachments[0], {
        content: binary.toString("base64"), filename: "report.bin", encoding: "base64",
        contentType: "application/octet-stream", contentDisposition: "attachment", cid: undefined,
    });
    assert.equal(message.attachments[1].cid, "logo");
    assert.equal(message.attachments[1].contentDisposition, "inline");
    const result = await create_real_transport({ streamTransport: true, buffer: true }).sendMail(message);
    const mime = result.message.toString();
    assert.match(mime, /From: Akeyless <avraham@akeyless-sys.com>/);
    assert.match(mime, /To: recipient@example.com/);
    assert.match(mime, /Cc: default-cc@example.com/);
    assert.match(mime, /Content-ID: <logo>/);
    assert.match(mime, /Content-Disposition: inline; filename=image.png/);
    assert.match(mime, /Content-Type: application\/octet-stream; name=report.bin/);
    assert.ok(mime.includes(binary.toString("base64")));
    assert.ok(mime.includes(Buffer.from("בדיקת דואר").toString("base64")));
});

test("provider and Google account changes are read on each call", async () => {
    await send_email(email);
    use_google();
    await send_email(email);
    settings.google = { email: "another@example.com", app_password: "another-password" };
    await send_email(email);
    assert.equal(sendgrid_messages.length, 1);
    assert.deepEqual(smtp_options.map(({ auth }) => auth.user), ["avraham@akeyless-sys.com", "another@example.com"]);
    assert.equal(google_messages[1].from.address, "another@example.com");
});

for (const [name, configure, input, expected] of [
    ["unknown provider", () => { settings.provider = "invalid"; }, email, /Unsupported email provider/],
    ["missing Google settings", () => { settings.provider = "google"; }, email, /Missing Google email settings/],
    ["missing Google email", () => { use_google(); settings.google.email = ""; }, email, /require email and app_password/],
    ["blank App Password", () => { use_google(); settings.google.app_password = "   "; }, email, /require email and app_password/],
    ["missing SendGrid key", () => { delete settings.sendgrid_api_key; }, email, /require sendgrid_api_key/],
    ["missing recipients", use_google, { ...email, to: undefined }, /group_name.*to/],
    ["missing body", use_google, { ...email, body_plain_text: undefined }, /body_plain_text/],
    ["unknown group", use_google, { ...email, group_name: "missing" }, /valid 'group_name'/],
]) {
    test(`${name} fails before provider delivery or audit`, async () => {
        configure();
        await send_email(input);
        assert.equal(google_messages.length + sendgrid_messages.length + smtp_options.length + audits.length, 0);
        assert.match(String(errors[0][1]), expected);
    });
}

test("Google can send without default CC or groups when recipients are explicit", async () => {
    use_google();
    delete settings.default_cc;
    delete settings.groups;
    await send_email(email);
    assert.deepEqual(google_messages[0].cc, []);
    assert.equal(errors.length, 0);
});

for (const partial of [false, true]) {
    test(`Google ${partial ? "partial recipient rejection" : "SMTP error"} logs failure without fallback or success audit`, async () => {
        use_google();
        if (partial) smtp_result.rejected = ["rejected@example.com"];
        else smtp_error = new Error("SMTP authentication failed");
        await send_email(email, { debug: true });
        assert.equal(audits.length + sendgrid_messages.length + logs.length, 0);
        assert.match(errors[0][1].message, partial ? /rejected@example.com/ : /SMTP authentication failed/);
        assert.ok(!JSON.stringify(errors).includes(settings.google.app_password));
    });
}

for (const throws of [false, true]) {
    test(`SendGrid ${throws ? "transport error" : "non-202 response"} preserves existing failure handling`, async () => {
        if (throws) sendgrid_error = new Error("SendGrid failed");
        else sendgrid_result = [{ statusCode: 400, body: "SendGrid failed" }, {}];
        await send_email(email);
        assert.equal(audits.length + google_messages.length, 0);
        assert.match(String(errors[0][1]), /SendGrid failed/);
    });
}

test("low-level Google sender defaults to its mailbox and throws on failure", async () => {
    use_google();
    await send_email_google(email, settings.google);
    assert.equal(google_messages[0].from, settings.google.email);
    assert.equal(audits.length, 0);
    smtp_error = new Error("SMTP failed");
    await assert.rejects(send_email_google(email, settings.google), /SMTP failed/);
    await assert.rejects(send_email_google(email, undefined), /require email and app_password/);
});
