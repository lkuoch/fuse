import SchemaBuilder, {
  type ObjectRef,
  type SchemaTypes,
  verifyRef,
} from "@pothos/core";
import type { ListShape } from "./types";

const schemaBuilderProto =
  SchemaBuilder.prototype as PothosSchemaTypes.SchemaBuilder<SchemaTypes>;

export const listRefs = new WeakMap<
  PothosSchemaTypes.SchemaBuilder<SchemaTypes>,
  unknown
>();

export const globalListFieldsMap = new WeakMap<
  PothosSchemaTypes.SchemaBuilder<SchemaTypes>,
  ((ref: unknown) => void)[]
>();

schemaBuilderProto.listObject = function listObject({
  type,
  name: listName,
  nullable,
}) {
  verifyRef(type);

  const listRef =
    this.objectRef<ListShape<SchemaTypes, unknown, false>>(listName);

  this.objectType(listRef, {
    fields: (t) => ({
      totalCount: t.int({
        nullable: true,
        resolve: (parent) => parent.totalCount || null,
      }),
      nodes: t.field({
        nullable: {
          items: nullable ?? true,
          list: false,
        },
        type: [type],
        resolve: (parent) => parent.nodes as any,
      }),
    }),
  });

  if (!listRefs.has(this)) {
    listRefs.set(this, []);
  }

  (listRefs.get(this) as unknown[])?.push(listRef);

  globalListFieldsMap.get(this)?.forEach((fieldFn) => void fieldFn(listRef));

  return listRef as never;
};
