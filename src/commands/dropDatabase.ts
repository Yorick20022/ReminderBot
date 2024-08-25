import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, Client, EmbedBuilder } from 'discord.js';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const data = new SlashCommandBuilder()
    .setName('dropdb')
    .setDescription('Drops the entire database, use with caution!')
export async function execute(interaction: ChatInputCommandInteraction) {

    const amount = (await prisma.reminder.findMany()).length

    try {
        await prisma.reminder.deleteMany({})
        interaction.reply(`Successfully deleted ${amount} results from the database.`)
    } catch {
        interaction.reply("Failed to delete results from the database.")
    }
}

