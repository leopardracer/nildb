import { describe } from "vitest";
import { type UuidDto, createUuidDto } from "#/common/types";
import type { DataDocument, UploadResult } from "#/data/data.repository";
import queryJson from "./data/wallet.query.json";
import schemaJson from "./data/wallet.schema.json";
import {
  expectErrorResponse,
  expectSuccessResponse,
} from "./fixture/assertions";
import type { QueryFixture, SchemaFixture } from "./fixture/fixture";
import { createTestFixtureExtension } from "./fixture/it";

describe("data operations", () => {
  const schema = schemaJson as unknown as SchemaFixture;
  const query = queryJson as unknown as QueryFixture;
  const { it, beforeAll, afterAll } = createTestFixtureExtension({
    schema,
    query,
  });
  beforeAll(async (_ctx) => {});
  afterAll(async (_ctx) => {});

  type Record = {
    _id: UuidDto;
    wallet: string;
    country: string;
    age: number;
  };

  it("can upload data", async ({ expect, bindings, organization }) => {
    const data: Record[] = [
      {
        _id: createUuidDto(),
        wallet: "0x1",
        country: "GBR",
        age: 20,
      },
      {
        _id: createUuidDto(),
        wallet: "0x2",
        country: "CAN",
        age: 30,
      },
      {
        _id: createUuidDto(),
        wallet: "0x3",
        country: "GBR",
        age: 40,
      },
    ];

    const response = await organization.uploadData({
      schema: schema.id,
      data,
    });

    const result = await expectSuccessResponse<UploadResult>(response);
    expect(result.data.created).toHaveLength(3);

    const cursor = bindings.db.data.collection(schema.id.toString()).find({});
    const records = await cursor.toArray();
    expect(records).toHaveLength(3);
  });

  it("rejects primary key collisions", async ({
    expect,
    skip,
    bindings,
    organization,
  }) => {
    skip("depends on indexes, disable until index endpoint is ready");

    const data = [
      {
        _id: createUuidDto(),
        wallet: "0x1",
        country: "GBR",
        age: 30,
      },
    ];

    const response = await organization.uploadData({
      schema: schema.id,
      data,
    });

    const result = await expectSuccessResponse<UploadResult>(response);
    expect(result.data.errors).toHaveLength(1);

    const cursor = bindings.db.data.collection(schema.id.toString()).find({});
    const records = await cursor.toArray();
    expect(records).toHaveLength(3);
  });

  it("allows for partial success", async ({ expect, skip, organization }) => {
    skip("depends on indexes, disable until index endpoint is ready");

    const data: Record[] = [
      {
        _id: createUuidDto(),
        wallet: "0x1", // collides expect failure
        country: "GBR",
        age: 30,
      },
      {
        _id: createUuidDto(),
        wallet: "0x4", // unique expect success
        country: "GBR",
        age: 30,
      },
    ];

    const response = await organization.uploadData({
      schema: schema.id,
      data,
    });

    const result = await expectSuccessResponse<UploadResult>(response);
    expect(result.data.errors).toHaveLength(1);
    expect(result.data.created).toHaveLength(1);
  });

  it("rejects duplicates in data payload", async ({
    expect,
    skip,
    bindings,
    organization,
  }) => {
    skip("depends on indexes, disable until index endpoint is ready");

    const data: Record[] = [
      {
        _id: createUuidDto(),
        wallet: "0x4",
        country: "GBR",
        age: 30,
      },
      {
        _id: createUuidDto(),
        wallet: "0x4",
        country: "GBR",
        age: 30,
      },
    ];

    await organization.uploadData({
      schema: schema.id,
      data,
    });

    const cursor = bindings.db.data.collection(schema.id.toString()).find({});
    const records = await cursor.toArray();
    expect(records).toHaveLength(4);
  });

  it("rejects data that does not conform", async ({ expect, organization }) => {
    const data: Record[] = [
      {
        _id: createUuidDto(),
        // @ts-expect-error should be string but want to check rejection
        wallet: true,
        country: "GBR",
        age: 30,
      },
    ];

    const response = await organization.uploadData({
      schema: schema.id,
      data,
    });

    const error = await expectErrorResponse(response);
    expect(error.errors.at(0)).includes("DataValidationError");
  });

  it("can run a query", async ({ expect, skip, organization }) => {
    skip("depends on indexes, disable until index endpoint is ready");

    const response = await organization.executeQuery({
      id: query.id,
      variables: query.variables,
    });

    const result = await expectSuccessResponse(response);
    expect(result.data).toEqual([
      {
        averageAge: 30,
        count: 3,
      },
    ]);
  });

  it("can read data by a single id", async ({
    expect,
    bindings,
    organization,
  }) => {
    const expected = await bindings.db.data
      .collection<DataDocument>(schema.id.toString())
      .findOne({});

    expect(expected).toBeDefined();
    const _id = expected!._id.toString();

    const response = await organization.readData({
      schema: schema.id,
      filter: { _id },
    });

    const result = await expectSuccessResponse<Record[]>(response);
    const actual = result.data[0];
    expect(actual._id).toBe(_id);
  });

  it("can read data from a list of ids", async ({
    expect,
    bindings,
    organization,
  }) => {
    const expected = await bindings.db.data
      .collection<DataDocument>(schema.id.toString())
      .find({})
      .limit(3)
      .toArray();

    expect(expected).toBeDefined();
    const ids = expected.map((document) => document._id.toString());

    const response = await organization.readData({
      schema: schema.id,
      filter: { _id: { $in: ids } },
    });

    const result = await expectSuccessResponse(response);
    expect(result.data).toHaveLength(3);
  });
});
