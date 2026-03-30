const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

    console.log("🤖 AI WhatsApp Bot Started...");

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const jid = msg.key.remoteJid;
        const text = msg.message.conversation || "";

        console.log("User:", text);

        // 🌟 MAIN MENU
        if (text === "menu") {
            await sock.sendMessage(jid, {
                text:
`📌 MAIN MENU

01 - 🤖 AI Chat
02 - 🏋️ AI Workout Coach
03 - 👤 Age Check System

👉 Type number to continue`
            });
        }

        // 🤖 AI CHAT
        else if (text === "01") {
            await sock.sendMessage(jid, {
                text: "🤖 AI: Hello! Ask me anything."
            });
        }

        // 🏋️ WORKOUT AI
        else if (text === "02") {
            await sock.sendMessage(jid, {
                text: "🏋️ AI Workout: Tell me your age to generate plan."
            });
        }

        // 👤 AGE SYSTEM
        else if (text === "03") {
            await sock.sendMessage(jid, {
                text: "👤 Send your age like: age 16"
            });
        }

        // AGE RESPONSE
        else if (text.toLowerCase().startsWith("age")) {
            const age = parseInt(text.split(" ")[1]);

            let reply = "";

            if (age < 13) {
                reply = "🧒 Kid plan: light exercise + study balance";
            }
            else if (age >= 13 && age <= 18) {
                reply = "🧑 Teen plan: workout + AI learning + sports";
            }
            else {
                reply = "🧑‍💼 Adult plan: gym + productivity system";
            }

            await sock.sendMessage(jid, { text: reply });
        }

        // DEFAULT AI
        else {
            await sock.sendMessage(jid, {
                text: "Type 'menu' to start 🤖"
            });
        }
    });
}

startBot();
