import type { NucToken } from "@nillion/nuc";
import { Effect as E, pipe } from "effect";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import type { OrganizationAccountDocument } from "#/accounts/accounts.types";
import { CreateSchemaIndexRequestSchema } from "#/admin/admin.types";
import { handleTaggedErrors } from "#/common/handler";
import { NucCmd } from "#/common/nuc-cmd-tree";
import { enforceSchemaOwnership } from "#/common/ownership";
import { PathsBeta, PathsV1 } from "#/common/paths";
import { type ControllerOptions, Uuid } from "#/common/types";
import { paramsValidator, payloadValidator } from "#/common/zod-utils";
import type { AppContext } from "#/env";
import {
  type EnforceCapabilityOptions,
  RoleSchema,
  enforceCapability,
  verifyNucAndLoadSubject,
} from "#/middleware/capability.middleware";
import * as SchemasService from "./schemas.services";
import {
  AddSchemaRequestSchema,
  DeleteSchemaRequestSchema,
} from "./schemas.types";

export function list(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.schemas.root;
  const guard = {
    path,
    cmd: NucCmd.nil.db.schemas,
    roles: [RoleSchema.enum.organization],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c: AppContext, _token: NucToken) => true,
  };

  app.get(
    path,
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const account = c.get("account") as OrganizationAccountDocument;

      return pipe(
        SchemasService.getOrganizationSchemas(c.env, account),
        E.map((data) => c.json({ data })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function add(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.schemas.root;
  const guard: EnforceCapabilityOptions = {
    path,
    cmd: NucCmd.nil.db.schemas,
    roles: [RoleSchema.enum.organization],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c, _token) => true,
  };

  app.post(
    path,
    payloadValidator(AddSchemaRequestSchema),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const account = c.get("account") as OrganizationAccountDocument;
      const payload = c.req.valid("json");

      return pipe(
        SchemasService.addSchema(c.env, {
          ...payload,
          owner: account._id,
        }),
        E.map(() => new Response(null, { status: StatusCodes.CREATED })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function remove(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsV1.schemas.root;
  const guard: EnforceCapabilityOptions = {
    path,
    cmd: NucCmd.nil.db.schemas,
    roles: [RoleSchema.enum.organization],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c, _token) => true,
  };

  app.delete(
    path,
    payloadValidator(DeleteSchemaRequestSchema),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const account = c.get("account") as OrganizationAccountDocument;
      const payload = c.req.valid("json");

      return pipe(
        enforceSchemaOwnership(account, payload.id),
        E.flatMap(() => SchemasService.deleteSchema(c.env, payload.id)),
        E.map(() => new Response(null, { status: StatusCodes.NO_CONTENT })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function metadata(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsBeta.schemas.byIdMeta;
  const guard: EnforceCapabilityOptions = {
    path,
    cmd: NucCmd.nil.db.schemas,
    roles: [RoleSchema.enum.organization],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c, _token) => true,
  };

  app.get(
    path,
    paramsValidator(
      z.object({
        id: Uuid,
      }),
    ),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const account = c.get("account") as OrganizationAccountDocument;
      const payload = c.req.valid("param");

      return pipe(
        enforceSchemaOwnership(account, payload.id),
        E.flatMap(() => SchemasService.getSchemaMetadata(c.env, payload.id)),
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

export function createIndex(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsBeta.schemas.byIdIndexes;
  const guard: EnforceCapabilityOptions = {
    path,
    cmd: NucCmd.nil.db.schemas,
    roles: [RoleSchema.enum.organization],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c, _token) => true,
  };

  app.post(
    path,
    payloadValidator(CreateSchemaIndexRequestSchema),
    paramsValidator(
      z.object({
        id: Uuid,
      }),
    ),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const account = c.get("account") as OrganizationAccountDocument;
      const payload = c.req.valid("json");
      const { id } = c.req.valid("param");

      return pipe(
        enforceSchemaOwnership(account, id),
        E.flatMap(() => SchemasService.createIndex(c.env, id, payload)),
        E.map(() => new Response(null, { status: StatusCodes.CREATED })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}

export function dropIndex(options: ControllerOptions): void {
  const { app, bindings } = options;
  const path = PathsBeta.schemas.byIdIndexesByName;
  const guard: EnforceCapabilityOptions = {
    path,
    cmd: NucCmd.nil.db.schemas,
    roles: [RoleSchema.enum.organization],
    // TODO: implement policy validation fix json on body type inference
    validate: (_c, _token) => true,
  };

  app.delete(
    PathsBeta.schemas.byIdIndexesByName,
    paramsValidator(
      z.object({
        id: Uuid,
        name: z.string().min(4),
      }),
    ),
    verifyNucAndLoadSubject(bindings),
    enforceCapability(bindings, guard),
    async (c) => {
      const account = c.get("account") as OrganizationAccountDocument;
      const { id, name } = c.req.valid("param");

      return pipe(
        enforceSchemaOwnership(account, id),
        E.flatMap(() => SchemasService.dropIndex(c.env, id, name)),
        E.map(() => new Response(null, { status: StatusCodes.NO_CONTENT })),
        handleTaggedErrors(c),
        E.runPromise,
      );
    },
  );
}
