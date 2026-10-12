import type {
  ChatInputCommandInteraction,
  ClientEvents,
  Collection,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

type AnySlashBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
| SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommandFile  {
  data: AnySlashBuilder;
  execute: (interaction: ChatInputCommandInteraction) => unknown;
}
export type SlashCommand = SlashCommandFile & { category: string };

export interface PrefixCommandFile {
  name: string;
  aliases?: string[];
  description?: string;
  usage?: string;
  execute: (message: Message, args: string[]) => unknown;
}
export type PrefixCommand = PrefixCommandFile & { category: string };

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (...args: ClientEvents[K]) => unknown;
}

export function defineEvent<K extends keyof ClientEvents>(event: Event<K>): Event<K> {
  return event;
}

export interface CommandRegistry<T> {
  lookup: Collection<string, T>;
  all: T[];
  byCategory: Collection<string, T[]>;
}

declare module "discord.js" {
  interface Client {
    slashCommands: CommandRegistry<SlashCommand>;
    prefixCommands: CommandRegistry<PrefixCommand>;
  }
}