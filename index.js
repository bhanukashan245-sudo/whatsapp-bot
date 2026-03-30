crequire("dotenv").config();

const express = require("express");
const P = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const OpenAI = require("openai");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ================= OPENAI =================
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

async function askGPT(text) {
    const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a fitness AI coach. Give short and simple answers."
            },
            { role: "user", content: text }
        ]
    });

    return res.choices[0].message.content;
}

// ================= BOT =================
let sock;

async function startBot(number) {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(number);
        console.log("🔥 PAIR CODE:", code);
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        const cmd = text.toLowerCase();

        // MENU
        if (cmd === ".menu") {
            await sock.sendMessage(from, {
                text:
`🤖 MENU

.ai → AI coach
.athletic → workout
.diet → diet
.abs → abs`
            });
        }

        // GPT AI
        else if (cmd.startsWith(".ai")) {
            const q = cmd.replace(".ai", "").trim();

            await sock.sendMessage(from, { text: "⏳ Thinking..." });

            const answer = await askGPT(q || "fitness tips");

            await sock.sendMessage(from, {
                text: "🤖 AI:\n\n" + answer
            });
        }

        // ATHLETIC
        else if (cmd === ".athletic") {
            await sock.sendMessage(from, {
                text: "🏋️ Push ups 10x3\nSquats 15x3\nPlank 30s"
            });
        }

        // DIET
        else if (cmd === ".diet") {
            await sock.sendMessage(from, {
                text: "🥗 Eggs, Chicken, Rice\nDrink 2-3L water"
            });
        }

        // ABS
        else if (cmd === ".abs") {
            await sock.sendMessage(from, {
                text: "🔥 Crunches 15x3\nLeg raises 12x3\nPlank daily"
            });
        }

        else if (cmd === "hi") {
            await sock.sendMessage(from, {
                text: "👋 Type .menu"
            });
        }
    });
}

// ================= WEB PANEL =================
app.get("/", (req, res) => {
    res.send(`
        <h2>WhatsApp GPT Bot</h2>
        <form method="POST" action="/pair">
            <input name="number" placeholder="94741954436" />
            <button>Get Pair Code</button>
        </form>
    `);
});

app.post("/pair", async (req, res) => {
    const number = req.body.number;
    startBot(number);
    res.send("Check console for Pair Code");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on", PORT);
});
