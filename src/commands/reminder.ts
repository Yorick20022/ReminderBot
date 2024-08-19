import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, Client, EmbedBuilder } from 'discord.js';
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import moment, { locale, locales, unix } from "moment"

// this is a top-level await 
const dbPromise = (async () => {
    // open the database
    const db = await open({
        filename: './extra/database.db',
        driver: sqlite3.Database
    });

    // Create the table if it doesn't exist
    await db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        reminder_text TEXT,
        unix_timestamp INT,
        readable_date TEXT
    )`);

    return db;
})();

export const data = new SlashCommandBuilder()
    .setName('setreminder')
    .setDescription('Sets a reminder for you')
    .addStringOption(option => option.setName('what').setDescription('Remind for?').setRequired(true))
    .addStringOption(option => option.setName('time').setDescription('What time?').setRequired(true))
    .addStringOption(option => option.setName('date').setDescription('What date?'));
export async function execute(interaction: ChatInputCommandInteraction) {

    const what = interaction.options.getString("what");
    const time = interaction.options.getString("time");
    let date = interaction.options.getString("date");

    // Regex to validate time input
    const regexTime: RegExp = /^([01]\d|2[0-3]):([0-5]\d)$/

    // checks if the input for time is valid
    const parsedTime = time?.match(regexTime)

    if (!parsedTime) {
        await interaction.reply({ content: "Please specify a correct time format, example `17:00`", ephemeral: true })
        return
    }

    // Only use this code in this block
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");

    const fullDateToday = `${day}-${month}-${year}`

    if (!date) {
        date = fullDateToday
    };
    //


    // Regex to validate date input
    const regexDate: RegExp = /^(\d{1,2})-(\d\d|2[0-9])-(\d{4})$/

    // checks if the input for date is empty, if it is, put the date of today.
    const parsedDate = date?.match(regexDate)
    if (!parsedDate) {
        await interaction.reply({ content: "Please specify a correct date format, example `16-08-2024`", ephemeral: true })
        return
    }

    const embed = new EmbedBuilder()
        .setTitle("Reminder set")
        .addFields(
            { name: 'What:', value: what as string },
            { name: 'Time:', value: time as string },
            { name: 'Date:', value: date as string },
        )
        .setColor("Green")

    const timeInput = time
    const dateInput = date
    const reversedDate = dateInput.split("-").reverse().join("-");
    const myDate: any = new Date(reversedDate);

    const [hourStr, minuteStr]: any = timeInput?.split(':');
    const hourInt = parseInt(hourStr);
    const minuteInt = parseInt(minuteStr);

    myDate.setHours(hourInt, minuteInt, 0, 0)
    const unixTimeStamp = myDate / 1000
    const humanReadableDateAndTime = `${date} ${time}`
    const userId = interaction.user.id
    
    const db = await dbPromise;
    await db.run(`INSERT INTO reminders (user_id, reminder_text, unix_timestamp, readable_date) VALUES (?, ?, ?, ?)`, userId, what, unixTimeStamp, humanReadableDateAndTime);

    await interaction.reply({
        embeds: [embed]
    });
}

