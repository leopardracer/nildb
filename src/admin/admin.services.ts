import { type Effect as E, pipe } from "effect";
import type {
  DatabaseError,
  DocumentNotFoundError,
  PrimaryCollectionNotFoundError,
} from "#/common/errors";
import type { NilDid } from "#/common/nil-did";
import type { AppBindings } from "#/env";
import * as AdminAccountRepository from "./admin.repository";
import type { AccountDocument } from "./admin.types";

export function listAllAccounts(
  ctx: AppBindings,
): E.Effect<
  AccountDocument[],
  DocumentNotFoundError | PrimaryCollectionNotFoundError | DatabaseError
> {
  return pipe(AdminAccountRepository.listAll(ctx));
}

export function deleteAccount(
  ctx: AppBindings,
  id: NilDid,
): E.Effect<
  void,
  DocumentNotFoundError | PrimaryCollectionNotFoundError | DatabaseError,
  never
> {
  return pipe(AdminAccountRepository.deleteOneById(ctx, id));
}
