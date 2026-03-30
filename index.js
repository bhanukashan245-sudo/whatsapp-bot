const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./auth")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: "silent" })
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "open") {
            console.log("🤖 Bot Online!")
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            console.log("❌ Disconnected. Reconnecting:", shouldReconnect)

            if (shouldReconnect) startBot()
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {

        const msg = messages[0]
        if (!msg.message) return

        const jid = msg.key.remoteJid
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        console.log("User:", text)

        // 📌 MENU
        if (text === "menu") {
            return sock.sendMessage(jid, {
                text:
`📌 MAIN MENU

01 🤖 AI Chat
02 🏋️ Workout AI
03 👤 Age System

Type number to continue`
            })
        }

        // 🤖 AI CHAT
        if (text === "01") {
            return sock.sendMessage(jid, {
                text: "🤖 AI: Hello! Ask me anything."
            })
        }

        // 🏋️ WORKOUT
        if (text === "02") {
            return sock.sendMessage(jid, {
                text: "🏋️ Tell me your age for workout plan."
            })
        }

        // 👤 AGE CHECK
        if (text === "03") {
            return sock.sendMessage(jid, {
                text: "👤 Send: age 16"
            })
        }

        // AGE LOGIC
        if (text.toLowerCase().startsWith("age")) {

            const age = parseInt(text.split(" ")[1])

            let reply = ""

            if (!age) reply = "❌ Invalid age format"
            else if (age < 13) reply = "🧒 Kid plan: study + light play"
            else if (age <= 18) reply = "🧑 Teen plan: gym + study balance"
            else reply = "💪 Adult plan: gym + productivity"

            return sock.sendMessage(jid, { text: reply })
        }

        // DEFAULT
        return sock.sendMessage(jid, {
            text: "Type 'menu' 🤖"
        })
    })
}

startBot()
