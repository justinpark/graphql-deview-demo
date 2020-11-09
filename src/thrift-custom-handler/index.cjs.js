'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

const thriftParser = require('@creditkarma/thrift-parser');
const utils = require('@graphql-mesh/utils');
const AggregateError = _interopDefault(require('aggregate-error'));
const graphql = require('graphql');
const graphqlScalars = require('graphql-scalars');
const thriftClient = require('@creditkarma/thrift-client');
const thriftServerCore = require('@creditkarma/thrift-server-core');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

/**
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 */
/**
 * Lower case as a function.
 */
function lowerCase(str) {
    return str.toLowerCase();
}

// Support camel case ("camelCase" -> "camel Case" and "CAMELCase" -> "CAMEL Case").
var DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];
// Remove all non-word characters.
var DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi;
/**
 * Normalize the string into something other libraries can manipulate easier.
 */
function noCase(input, options) {
    if (options === void 0) { options = {}; }
    var _a = options.splitRegexp, splitRegexp = _a === void 0 ? DEFAULT_SPLIT_REGEXP : _a, _b = options.stripRegexp, stripRegexp = _b === void 0 ? DEFAULT_STRIP_REGEXP : _b, _c = options.transform, transform = _c === void 0 ? lowerCase : _c, _d = options.delimiter, delimiter = _d === void 0 ? " " : _d;
    var result = replace(replace(input, splitRegexp, "$1\0$2"), stripRegexp, "\0");
    var start = 0;
    var end = result.length;
    // Trim the delimiter from around the output string.
    while (result.charAt(start) === "\0")
        start++;
    while (result.charAt(end - 1) === "\0")
        end--;
    // Transform each token independently.
    return result
        .slice(start, end)
        .split("\0")
        .map(transform)
        .join(delimiter);
}
/**
 * Replace `re` in the input string with the replacement value.
 */
function replace(input, re, value) {
    if (re instanceof RegExp)
        return input.replace(re, value);
    return re.reduce(function (input, re) { return input.replace(re, value); }, input);
}

function pascalCaseTransform(input, index) {
    var firstChar = input.charAt(0);
    var lowerChars = input.substr(1).toLowerCase();
    if (index > 0 && firstChar >= "0" && firstChar <= "9") {
        return "_" + firstChar + lowerChars;
    }
    return "" + firstChar.toUpperCase() + lowerChars;
}
function pascalCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: "", transform: pascalCaseTransform }, options));
}

class ThriftHandler {
    constructor({ config, cache }) {
        this.config = config;
        this.cache = cache;
    }
    async getMeshSource() {
        var _a, _b;
        const { schemaHeaders, serviceName, operationHeaders } = this.config;
        const rawThrift = await utils.readFileOrUrlWithCache(this.config.idl, this.cache, {
            allowUnknownExtensions: true,
            headers: schemaHeaders,
        });
        const thriftAST = thriftParser.parse(rawThrift, { organize: false });
        const enumTypeMap = new Map();
        const outputTypeMap = new Map();
        const inputTypeMap = new Map();
        const rootFields = {};
        const annotations = {};
        const methodAnnotations = {};
        const methodNames = [];
        const methodParameters = {};
        const topTypeMap = {};
        class MeshThriftClient extends thriftServerCore.ThriftClient {
            constructor() {
                super(...arguments);
                this._serviceName = serviceName;
                this._annotations = annotations;
                this._methodAnnotations = methodAnnotations;
                this._methodNames = methodNames;
                this._methodParameters = methodParameters;
            }
            writeType(typeVal, value, output) {
                switch (typeVal.type) {
                    case thriftServerCore.TType.BOOL:
                        output.writeBool(value);
                        break;
                    case thriftServerCore.TType.BYTE:
                        output.writeByte(value);
                        break;
                    case thriftServerCore.TType.DOUBLE:
                        output.writeDouble(value);
                        break;
                    case thriftServerCore.TType.I16:
                        output.writeI16(value);
                        break;
                    case thriftServerCore.TType.I32:
                        output.writeI32(value);
                        break;
                    case thriftServerCore.TType.I64:
                        output.writeI64(value.toString());
                        break;
                    case thriftServerCore.TType.STRING:
                        output.writeString(value);
                        break;
                    case thriftServerCore.TType.STRUCT: {
                        output.writeStructBegin(typeVal.name);
                        const typeMap = typeVal.fields;
                        for (const argName in value) {
                            const argType = typeMap[argName];
                            const argVal = value[argName];
                            if (argType) {
                                output.writeFieldBegin(argName, argType.type, argType.id);
                                this.writeType(argType, argVal, output);
                                output.writeFieldEnd();
                            }
                        }
                        output.writeFieldStop();
                        output.writeStructEnd();
                        break;
                    }
                    case thriftServerCore.TType.ENUM:
                        // TODO: A
                        break;
                    case thriftServerCore.TType.MAP: {
                        const keys = Object.keys(value);
                        output.writeMapBegin(typeVal.keyType.type, typeVal.valType.type, keys.length);
                        for (const key of keys) {
                            this.writeType(typeVal.keyType, key, output);
                            const val = value[key];
                            this.writeType(typeVal.valType, val, output);
                        }
                        output.writeMapEnd();
                        break;
                    }
                    case thriftServerCore.TType.LIST:
                        output.writeListBegin(typeVal.elementType.type, value.length);
                        for (const element of value) {
                            this.writeType(typeVal.elementType, element, output);
                        }
                        output.writeListEnd();
                        break;
                    case thriftServerCore.TType.SET:
                        output.writeSetBegin(typeVal.elementType.type, value.length);
                        for (const element of value) {
                            this.writeType(typeVal.elementType, element, output);
                        }
                        output.writeSetEnd();
                        break;
                }
            }
            readType(type, input, fields) {
                switch (type) {
                    case thriftServerCore.TType.BOOL:
                        return input.readBool();
                    case thriftServerCore.TType.BYTE:
                        return input.readByte();
                    case thriftServerCore.TType.DOUBLE:
                        return input.readDouble();
                    case thriftServerCore.TType.I16:
                        return input.readI16();
                    case thriftServerCore.TType.I32:
                        return input.readI32();
                    case thriftServerCore.TType.I64:
                        return BigInt(input.readI64().toString());
                    case thriftServerCore.TType.STRING:
                        return input.readString();
                    case thriftServerCore.TType.STRUCT: {
                        const result = {};
                        input.readStructBegin();
                        while (true) {
                            const field = input.readFieldBegin();
                            const fieldType = field.fieldType;
                            const fieldName = field.fieldName || fields[field.fieldId] || 'success';
                            if (fieldType === thriftServerCore.TType.STOP) {
                                break;
                            }
                            if (fieldName && fieldName.name) {
                                result[fieldName.name] = this.readType(fieldType, input, fieldName.fields);
                            } else {
                                result[fieldName] = this.readType(fieldType, input, fields);
                            }
                            input.readFieldEnd();
                        }
                        input.readStructEnd();
                        return result;
                    }
                    case thriftServerCore.TType.ENUM:
                        // TODO: A
                        break;
                    case thriftServerCore.TType.MAP: {
                        const result = {};
                        const map = input.readMapBegin();
                        for (let i = 0; i < map.size; i++) {
                            const key = this.readType(map.keyType, input, fields);
                            const value = this.readType(map.valueType, input, fields);
                            result[key] = value;
                        }
                        input.readMapEnd();
                        return result;
                    }
                    case thriftServerCore.TType.LIST: {
                        const result = [];
                        const list = input.readListBegin();
                        for (let i = 0; i < list.size; i++) {
                            const element = this.readType(list.elementType, input, fields);
                            result.push(element);
                        }
                        input.readListEnd();
                        return result;
                    }
                    case thriftServerCore.TType.SET: {
                        const result = [];
                        const list = input.readSetBegin();
                        for (let i = 0; i < list.size; i++) {
                            const element = this.readType(list.elementType, input, fields);
                            result.push(element);
                        }
                        input.readSetEnd();
                        return result;
                    }
                }
            }
            async doRequest(methodName, args, fields, responseFields, context) {
                const Transport = this.transport;
                const Protocol = this.protocol;
                const writer = new Transport();
                const output = new Protocol(writer);
                const id = this.incrementRequestId();
                output.writeMessageBegin(methodName, thriftServerCore.MessageType.CALL, id);
                this.writeType({
                    name: pascalCase(methodName) + '__Args',
                    type: thriftServerCore.TType.STRUCT,
                    fields,
                    id,
                }, args, output);
                output.writeMessageEnd();
                const data = await this.connection.send(writer.flush(), context);
                const reader = this.transport.receiver(data);
                const input = new Protocol(reader);
                const { fieldName, messageType } = input.readMessageBegin();
                if (fieldName === methodName) {
                    if (messageType === thriftServerCore.MessageType.EXCEPTION) {
                        const err = thriftServerCore.TApplicationExceptionCodec.decode(input);
                        input.readMessageEnd();
                        return Promise.reject(err);
                    }
                    else {
                        const result = this.readType(thriftServerCore.TType.STRUCT, input, responseFields);
                        input.readMessageEnd();
                        if (result.success != null) {
                            return result.success;
                        }
                        else {
                            throw new thriftServerCore.TApplicationException(thriftServerCore.TApplicationExceptionType.UNKNOWN, methodName + ' failed: unknown result');
                        }
                    }
                }
                else {
                    throw new thriftServerCore.TApplicationException(thriftServerCore.TApplicationExceptionType.WRONG_METHOD_NAME, 'Received a response to an unknown RPC function: ' + fieldName);
                }
            }
        }
        MeshThriftClient.serviceName = serviceName;
        MeshThriftClient.annotations = annotations;
        MeshThriftClient.methodAnnotations = methodAnnotations;
        MeshThriftClient.methodNames = methodNames;
        const thriftHttpClient = thriftClient.createHttpClient(MeshThriftClient, {
            ...this.config,
            requestOptions: {
                headers: operationHeaders,
            },
        });
        function processComments(comments) {
            return comments.map(comment => comment.value).join('\n');
        }
        function getGraphQLFunctionType(functionType, id = Math.random()) {
            let inputType;
            let outputType;
            let typeVal;
            switch (functionType.type) {
                case thriftParser.SyntaxType.BinaryKeyword:
                case thriftParser.SyntaxType.StringKeyword:
                    inputType = graphql.GraphQLString;
                    outputType = graphql.GraphQLString;
                    break;
                case thriftParser.SyntaxType.DoubleKeyword:
                    inputType = graphql.GraphQLFloat;
                    outputType = graphql.GraphQLFloat;
                    typeVal = typeVal || { type: thriftServerCore.TType.DOUBLE };
                    break;
                case thriftParser.SyntaxType.VoidKeyword:
                    typeVal = typeVal || { type: thriftServerCore.TType.VOID };
                    inputType = graphqlScalars.GraphQLVoid;
                    outputType = graphqlScalars.GraphQLVoid;
                    break;
                case thriftParser.SyntaxType.BoolKeyword:
                    typeVal = typeVal || { type: thriftServerCore.TType.BOOL };
                    inputType = graphql.GraphQLBoolean;
                    outputType = graphql.GraphQLBoolean;
                    break;
                case thriftParser.SyntaxType.I8Keyword:
                    inputType = graphql.GraphQLInt;
                    outputType = graphql.GraphQLInt;
                    typeVal = typeVal || { type: thriftServerCore.TType.I08 };
                    break;
                case thriftParser.SyntaxType.I16Keyword:
                    inputType = graphql.GraphQLInt;
                    outputType = graphql.GraphQLInt;
                    typeVal = typeVal || { type: thriftServerCore.TType.I16 };
                    break;
                case thriftParser.SyntaxType.I32Keyword:
                    inputType = graphql.GraphQLInt;
                    outputType = graphql.GraphQLInt;
                    typeVal = typeVal || { type: thriftServerCore.TType.I32 };
                    break;
                case thriftParser.SyntaxType.ByteKeyword:
                    inputType = graphqlScalars.GraphQLByte;
                    outputType = graphqlScalars.GraphQLByte;
                    typeVal = typeVal || { type: thriftServerCore.TType.BYTE };
                    break;
                case thriftParser.SyntaxType.I64Keyword:
                    inputType = graphqlScalars.GraphQLBigInt;
                    outputType = graphqlScalars.GraphQLBigInt;
                    typeVal = typeVal || { type: thriftServerCore.TType.I64 };
                    break;
                case thriftParser.SyntaxType.ListType: {
                    const ofTypeList = getGraphQLFunctionType(functionType.valueType, id);
                    inputType = new graphql.GraphQLList(ofTypeList.inputType);
                    outputType = new graphql.GraphQLList(ofTypeList.outputType);
                    typeVal = typeVal || { type: thriftServerCore.TType.LIST, elementType: ofTypeList.typeVal };
                    break;
                }
                case thriftParser.SyntaxType.SetType: {
                    const ofSetType = getGraphQLFunctionType(functionType.valueType, id);
                    inputType = new graphql.GraphQLList(ofSetType.inputType);
                    outputType = new graphql.GraphQLList(ofSetType.outputType);
                    typeVal = typeVal || { type: thriftServerCore.TType.SET, elementType: ofSetType.typeVal };
                    break;
                }
                case thriftParser.SyntaxType.MapType: {
                    inputType = graphqlScalars.GraphQLJSON;
                    outputType = graphqlScalars.GraphQLJSON;
                    const ofTypeKey = getGraphQLFunctionType(functionType.keyType, id);
                    const ofTypeValue = getGraphQLFunctionType(functionType.valueType, id);
                    typeVal = typeVal || { type: thriftServerCore.TType.MAP, keyType: ofTypeKey.typeVal, valType: ofTypeValue.typeVal };
                    break;
                }
                case thriftParser.SyntaxType.Identifier: {
                    const typeName = functionType.value;
                    if (enumTypeMap.has(typeName)) {
                        const enumType = enumTypeMap.get(typeName);
                        inputType = enumType;
                        outputType = enumType;
                    }
                    if (inputTypeMap.has(typeName)) {
                        inputType = inputTypeMap.get(typeName);
                    }
                    if (outputTypeMap.has(typeName)) {
                        outputType = outputTypeMap.get(typeName);
                    }
                    typeVal = topTypeMap[typeName];
                    break;
                }
                default:
                    throw new Error(`Unknown function type: ${JSON.stringify(functionType, null, 2)}!`);
            }
            return {
                inputType: inputType,
                outputType: outputType,
                typeVal: {
                    ...typeVal,
                    id,
                },
            };
        }
        const { args: commonArgs, contextVariables } = utils.parseInterpolationStrings(Object.values(operationHeaders || {}));
        const headersFactory = utils.getInterpolatedHeadersFactory(operationHeaders);
        switch (thriftAST.type) {
            case thriftParser.SyntaxType.ThriftDocument: {
                for (const statement of thriftAST.body) {
                    switch (statement.type) {
                        case thriftParser.SyntaxType.EnumDefinition:
                            enumTypeMap.set(statement.name.value, new graphql.GraphQLEnumType({
                                name: statement.name.value,
                                description: processComments(statement.comments),
                                values: statement.members.reduce((prev, curr) => ({
                                    ...prev,
                                    [curr.name.value]: {
                                        description: processComments(curr.comments),
                                        value: curr.name.value,
                                    },
                                }), {}),
                            }));
                            break;
                        case thriftParser.SyntaxType.StructDefinition: {
                            const structName = statement.name.value;
                            const description = processComments(statement.comments);
                            const objectFields = {};
                            const inputObjectFields = {};
                            const structTypeVal = {
                                id: Math.random(),
                                name: structName,
                                type: thriftServerCore.TType.STRUCT,
                                fields: {},
                            };
                            topTypeMap[structName] = structTypeVal;
                            const structFieldTypeMap = structTypeVal.fields;
                            for (const field of statement.fields) {
                                const fieldName = field.name.value;
                                let fieldOutputType;
                                let fieldInputType;
                                const description = processComments(field.comments);
                                const processedFieldTypes = getGraphQLFunctionType(field.fieldType, (_a = field.fieldID) === null || _a === void 0 ? void 0 : _a.value);
                                fieldOutputType = processedFieldTypes.outputType;
                                fieldInputType = processedFieldTypes.inputType;
                                if (field.requiredness === 'required') {
                                    fieldOutputType = new graphql.GraphQLNonNull(fieldOutputType);
                                    fieldInputType = new graphql.GraphQLNonNull(fieldInputType);
                                }
                                objectFields[fieldName] = {
                                    type: fieldOutputType,
                                    description,
                                };
                                inputObjectFields[fieldName] = {
                                    type: fieldInputType,
                                    description,
                                };
                                structFieldTypeMap[fieldName] = processedFieldTypes.typeVal;
                            }
                            outputTypeMap.set(structName, new graphql.GraphQLObjectType({
                                name: structName,
                                description,
                                fields: objectFields,
                            }));
                            inputTypeMap.set(structName, new graphql.GraphQLInputObjectType({
                                name: structName + 'Input',
                                description,
                                fields: inputObjectFields,
                            }));
                            break;
                        }
                        case thriftParser.SyntaxType.ServiceDefinition:
                            for (const fnIndex in statement.functions) {
                                const fn = statement.functions[fnIndex];
                                const fnName = fn.name.value;
                                const description = processComments(fn.comments);
                                const { outputType: returnType, typeVal: responseTypeVal } = getGraphQLFunctionType(fn.returnType, Number(fnIndex) + 1);
                                const args = {
                                    ...commonArgs,
                                };
                                const fieldTypeMap = {};
                                const responseTypeMap = {};
                                for (const field of fn.fields) {
                                    const fieldName = field.name.value;
                                    const fieldDescription = processComments(field.comments);
                                    let { inputType: fieldType, typeVal } = getGraphQLFunctionType(field.fieldType, (_b = field.fieldID) === null || _b === void 0 ? void 0 : _b.value);
                                    if (field.requiredness === 'required') {
                                        fieldType = new graphql.GraphQLNonNull(fieldType);
                                    }
                                    args[fieldName] = {
                                        type: fieldType,
                                        description: fieldDescription,
                                    };
                                    fieldTypeMap[fieldName] = typeVal;
                                }

                                function getTypeMap(typeMap, fields) {
                                    Object.entries(fields).forEach(([fieldName, { id, elementType }]) => {
                                        if (elementType && elementType.fields) {
                                            const subMap = {};
                                            getTypeMap(subMap, elementType.fields);
                                            typeMap[id] = { name: fieldName, fields: subMap };
                                        } else {
                                            typeMap[id] = fieldName;
                                        }
                                    });
                                }
                                getTypeMap(responseTypeMap, responseTypeVal.fields);
                                rootFields[fnName] = {
                                    type: returnType,
                                    description,
                                    args,
                                    resolve: async (root, args, context, info) => thriftHttpClient.doRequest(fnName, args, fieldTypeMap, responseTypeMap, {
                                        headers: headersFactory({ root, args, context, info }),
                                    }),
                                };
                                methodNames.push(fnName);
                                methodAnnotations[fnName] = { annotations: {}, fieldAnnotations: {} };
                                methodParameters[fnName] = fn.fields.length + 1;
                            }
                            break;
                        case thriftParser.SyntaxType.TypedefDefinition: {
                            const { inputType, outputType } = getGraphQLFunctionType(statement.definitionType, Math.random());
                            const typeName = statement.name.value;
                            inputTypeMap.set(typeName, inputType);
                            outputTypeMap.set(typeName, outputType);
                            break;
                        }
                    }
                }
                const queryObjectType = new graphql.GraphQLObjectType({
                    name: 'Query',
                    fields: rootFields,
                });
                const schema = new graphql.GraphQLSchema({
                    query: queryObjectType,
                });
                return {
                    schema,
                    contextVariables,
                };
            }
            // break;
            case thriftParser.SyntaxType.ThriftErrors:
                throw new AggregateError(thriftAST.errors);
        }
    }
}

module.exports = ThriftHandler;