import type { FieldValues, Resolver } from "react-hook-form";
import type { TFunction } from "@/i18n/runtime";

/**
 * The zod validation messages (src/lib/buyauto/schemas.ts and the local
 * schemas in these forms) are written in German and double as i18n keys.
 * <FormMessage> renders error.message as is, so the messages are passed
 * through t() on their way out of the resolver: fr/it/en show the translation,
 * German (where t() returns the key) renders exactly as before.
 */
export function translatedResolver<T extends FieldValues>(resolver: Resolver<T>, t: TFunction): Resolver<T> {
  return async (values, context, options) => {
    const result = await resolver(values, context, options);
    for (const error of Object.values(result.errors) as Array<{ message?: unknown } | undefined>) {
      if (error && typeof error.message === "string") error.message = t(error.message);
    }
    return result;
  };
}
