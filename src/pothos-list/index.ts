import "./global-types";
import "./schema-builder";
import SchemaBuilder, {
  BasePlugin,
  type FieldKind,
  type SchemaTypes,
  RootFieldBuilder,
} from "@pothos/core";
import type { ListShape } from "./types";

const pluginName = "fuselist" as const;

export default pluginName;

export class PothosListPlugin<
  Types extends SchemaTypes
> extends BasePlugin<Types> {}

try {
  SchemaBuilder.registerPlugin(pluginName, PothosListPlugin);
} catch (e) {}

const fieldBuilderProto =
  RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
    SchemaTypes,
    unknown,
    FieldKind
  >;

// @ts-ignore
fieldBuilderProto.list = function list(fieldOptions) {
  const ref =
    this.builder.objectRef<ListShape<SchemaTypes, unknown, boolean>>(
      "Unnamed list"
    );

  const fieldRef = this.field({
    ...fieldOptions,
    type: ref,
    args: {
      ...fieldOptions.args,
    },
    resolve: fieldOptions.resolve as never,
  } as never);

  // @ts-ignore
  this.builder.configStore.onFieldUse(fieldRef, (fieldConfig) => {
    const name = fieldConfig.name[0].toUpperCase() + fieldConfig.name.slice(1);
    // @ts-ignore
    const listName = `${this.typename}${name}${
      fieldConfig.name.toLowerCase().endsWith("list") ? "" : "List"
    }`;

    this.builder.listObject({
      type: fieldOptions.type,
      name: listName,
      nullable: fieldOptions.nodeNullable ?? true,
    });

    // @ts-ignore
    this.builder.configStore.associateRefWithName(ref, listName);
  });

  return fieldRef;
};
