import 'dotenv/config'
import fs from 'fs';
import path from 'path'
import { Client, Partials, Collection, Events, IntentsBitField, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const token = process.env.TOKEN as string
// Create intents
const intents = new IntentsBitField([
	IntentsBitField.Flags.DirectMessageReactions,
	IntentsBitField.Flags.DirectMessages,
	IntentsBitField.Flags.GuildEmojisAndStickers,
	IntentsBitField.Flags.GuildInvites,
	IntentsBitField.Flags.GuildMembers,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.GuildMessageReactions,
	IntentsBitField.Flags.GuildPresences,
	IntentsBitField.Flags.GuildVoiceStates,
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildMessageTyping,
	IntentsBitField.Flags.MessageContent,
	IntentsBitField.Flags.GuildModeration
]);

// Create the discord bot client
const client = new Client({
	intents: intents,
	partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

type Command = {
	data: SlashCommandBuilder,
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>
};

const commands = new Collection<string, Command>()

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching: ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}



setInterval(async () => {

	const userID = process.env.USER_ID as string
	const guild = client.guilds.cache.get(process.env.GUILD_ID as string);
	const user = await guild?.members.fetch(userID)
	const currentTimeStamp = Math.floor(Date.now() / 1000)

	const result = await prisma.reminder.findMany({
		where: {
			unix_timestamp: { lte: currentTimeStamp },
			done: false
		}
	})

	if (result.length === 0) return

	const reminderText = result[0].reminder_text
	const reminderId = result[0].id

	const reminderMessage = await user?.send(`Reminder: ${reminderText}`);
	
	if (reminderMessage === null) {
		console.log("Message did not arrive");
	} else {
		console.log("Reminded successfully");
	}

	await prisma.reminder.update({
		where: {
			id: reminderId
		},
		data: {
			done: true,
		},
	})


}, 10000)

// Log in to Discord with your client's token
client.login(token);