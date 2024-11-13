import { Effect as E, pipe } from "effect";
import { id } from "effect/Fiber";
import mongoose from "mongoose";
import type { JsonObject } from "type-fest";
import { z } from "zod";
import type { CreateOrgReqBody } from "#/handlers/handle-create-org";

export interface OrgQuery {
  pipeline: string;
  schema: string;
}

// eg 17 = {prefix len 5}_schema_{id len 4}
export const SchemaName = z.string().length(17);
export type SchemaName = z.infer<typeof SchemaName>;

export interface OrgDocument extends mongoose.Document {
  name: string;
  prefix: string;
  schemas: Record<SchemaName, JsonObject>;
  queries: Record<string, OrgQuery>;
}

export type OrgDocumentLean = mongoose.FlattenMaps<OrgDocument>;

const OrgDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    prefix: { type: String, unique: true },
    schemas: { type: Map, default: new Map() },
    queries: {
      type: Map,
      of: {
        pipeline: String,
        schema: String,
      },
      default: new Map(),
    },
  },
  { timestamps: true },
);

export const OrgDocumentModel = mongoose.model("orgs", OrgDocumentSchema);

export function createOrgRecord(
  org: CreateOrgReqBody,
): E.Effect<OrgDocument, Error> {
  return pipe(
    E.tryPromise(() =>
      new OrgDocumentModel({
        name: org.name,
        prefix: org.prefix,
      }).save(),
    ),
    E.mapError(
      (cause) =>
        new Error(`Failed to create organization for ${org.name}`, {
          cause,
        }),
    ),
    E.map((result) => result as OrgDocument),
  );
}

export function listOrgRecords(): E.Effect<OrgDocument[], Error> {
  return pipe(
    E.tryPromise(() => OrgDocumentModel.find({})),
    E.mapError((cause) => new Error("Failed to list organizations", { cause })),
    E.map((result) => result as OrgDocument[]),
  );
}

export function findOrgById(_id: string): E.Effect<OrgDocument, Error> {
  return pipe(
    E.tryPromise(() => OrgDocumentModel.findOne({ _id })),
    E.mapError((cause) => new Error(`Failed to find orgs/${id}`, { cause })),
    E.map((result) => result as OrgDocument),
  );
}

export function deleteOrgRecord(_id: string): E.Effect<OrgDocument, Error> {
  return pipe(
    E.tryPromise(() => OrgDocumentModel.findOneAndDelete({ _id })),
    E.mapError(
      (cause) =>
        new Error(`Failed to delete orgs/${_id}`, {
          cause,
        }),
    ),
    E.map((result) => result as OrgDocument),
  );
}
