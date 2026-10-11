import type { Client, ClientEvents } from "discord.js";
import type { Event } from "../types.js";
import { importFile, resolveFrom, walk } from "./walk.js";

type LoadedEvent = Event<keyof ClientEvents>;

function isEvent(value: unknown): value is LoadedEvent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<LoadedEvent>;
  return typeof candidate.name === "string" && typeof candidate.execute === "function";
}


export async function loadEvents(client: Client): Promise<void> {

    const dir = resolveFrom(import.meta.url, "..", "events");
    let count = 0;

    for (const file of await walk(dir)) {
        const loaded = await importFile(file);

        if (!isEvent(loaded)) {
          console.warn(`[Event] ${file} no exporta por default un Event valido, lo salto`);
          continue;
        }

        const handler = loaded.execute as (...args: unknown[])  => unknown;

        const listener = (...args: unknown[]) => {
            void (async () => {
                try {
                    await handler(...args);
                }catch (e){
                    console.log(`Error en "${loaded.name}"`, e)
                }
            })();
        };
        if(loaded.once == true){
            client.on(loaded.name, listener)
        }else{
            client.on(loaded.name, listener)
        }
        count++;
    }

    console.log(`Eventos: ${count} se han rgistrado`);
}