import type { NucToken } from "@nillion/nuc";
import { Effect as E, pipe } from "effect";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import * as AccountService from "#/accounts/accounts.services";
import { handleTaggedErrors } from "#/common/handler";
import { NucCmd } from "#/common/nuc-cmd-tree";
import { PathsV1 } from "#/common/paths";
import { type ControllerOptions, DidSchema } from "#/common/types";
import { paramsValidator, payloadValidator } from "#/common/zod-utils";
import type { AppContext } from "#/env";
import {
  RoleSchema,
  enforceCapability,
  verifyNucAndLoadSubject,
} from "#/middleware/capability.middleware";
import * as AdminService from "./admin.services";
import {
  AdminCreateAccountRequestSchema,
  AdminDeleteAccountRequestSchema,
  AdminSetSubscriptionStateRequestSchema,
} from "./admin.types";

export function create(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.admin.accounts.root;
  const guard = {
    path,
    cmd: NucCmd.nil.db.admin,
    roles: [RoleSchema.enum.root, RoleSchema.enum.admin],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c: AppContext, _token: NucToken) => true,
  };

  app.post(
    path,
    payloadValidator(AdminCreateAccountRequestSchema),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const payload = c.req.valid("json");

      return pipe(
        AccountService.createAccount(c.env, payload),
        E.map(() => new Response(null, { status: StatusCodes.CREATED })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function remove(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.admin.accounts.root;
  const guard = {
    path,
    cmd: NucCmd.nil.db.admin,
    roles: [RoleSchema.enum.admin],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c: AppContext, _token: NucToken) => true,
  };

  app.delete(
    path,
    payloadValidator(AdminDeleteAccountRequestSchema),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const payload = c.req.valid("json");

      return pipe(
        AdminService.deleteAccount(c.env, payload.id),
        E.map(() => new Response(null, { status: StatusCodes.NO_CONTENT })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function list(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.admin.accounts.root;
  const guard = {
    path,
    cmd: NucCmd.nil.db.admin,
    roles: [RoleSchema.enum.admin],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c: AppContext, _token: NucToken) => true,
  };

  app.get(
    path,
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      return pipe(
        AdminService.listAllAccounts(c.env),
        E.map((data) => c.json({ data })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function setSubscriptionState(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.admin.accounts.subscription;
  const guard = {
    path,
    cmd: NucCmd.nil.db.admin,
    roles: [RoleSchema.enum.admin],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c: AppContext, _token: NucToken) => true,
  };

  app.post(
    path,
    payloadValidator(AdminSetSubscriptionStateRequestSchema),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const payload = c.req.valid("json");

      return pipe(
        AccountService.setSubscriptionState(c.env, payload),
        E.map(() => new Response(null, { status: StatusCodes.OK })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function getSubscriptionState(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.admin.accounts.subscriptionByDid;
  const guard = {
    path,
    cmd: NucCmd.nil.db.admin,
    roles: [RoleSchema.enum.admin],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c: AppContext, _token: NucToken) => true,
  };

  app.get(
    path,
    paramsValidator(
      z.object({
        did: DidSchema,
      }),
    ),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const payload = c.req.valid("param");

      return pipe(
        AccountService.getSubscriptionState(c.env, payload.did),
        E.map((data) =>
          c.json({
            data,
          }),
        ),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}
