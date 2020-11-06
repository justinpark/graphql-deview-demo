/* tslint:disable */
/* eslint-disable */
/*
 * Autogenerated by @creditkarma/thrift-typescript v3.7.6
 * DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
*/
import * as thrift from "@creditkarma/thrift-server-core";
export interface IProductCard {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
}
export interface IProductCardArgs {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
}
export const ProductCardCodec: thrift.IStructCodec<IProductCardArgs, IProductCard> = {
    encode(args: IProductCardArgs, output: thrift.TProtocol): void {
        const obj: any = {
            title: args.title,
            subtitle: args.subtitle,
            imageUrl: args.imageUrl
        };
        output.writeStructBegin("ProductCard");
        if (obj.title != null) {
            output.writeFieldBegin("title", thrift.TType.STRING, 1);
            output.writeString(obj.title);
            output.writeFieldEnd();
        }
        if (obj.subtitle != null) {
            output.writeFieldBegin("subtitle", thrift.TType.STRING, 2);
            output.writeString(obj.subtitle);
            output.writeFieldEnd();
        }
        if (obj.imageUrl != null) {
            output.writeFieldBegin("imageUrl", thrift.TType.STRING, 3);
            output.writeString(obj.imageUrl);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    },
    decode(input: thrift.TProtocol): IProductCard {
        let _args: any = {};
        input.readStructBegin();
        while (true) {
            const ret: thrift.IThriftField = input.readFieldBegin();
            const fieldType: thrift.TType = ret.fieldType;
            const fieldId: number = ret.fieldId;
            if (fieldType === thrift.TType.STOP) {
                break;
            }
            switch (fieldId) {
                case 1:
                    if (fieldType === thrift.TType.STRING) {
                        const value_1: string = input.readString();
                        _args.title = value_1;
                    }
                    else {
                        input.skip(fieldType);
                    }
                    break;
                case 2:
                    if (fieldType === thrift.TType.STRING) {
                        const value_2: string = input.readString();
                        _args.subtitle = value_2;
                    }
                    else {
                        input.skip(fieldType);
                    }
                    break;
                case 3:
                    if (fieldType === thrift.TType.STRING) {
                        const value_3: string = input.readString();
                        _args.imageUrl = value_3;
                    }
                    else {
                        input.skip(fieldType);
                    }
                    break;
                default: {
                    input.skip(fieldType);
                }
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return {
            title: _args.title,
            subtitle: _args.subtitle,
            imageUrl: _args.imageUrl
        };
    }
};
export class ProductCard extends thrift.StructLike implements IProductCard {
    public title?: string;
    public subtitle?: string;
    public imageUrl?: string;
    public readonly _annotations: thrift.IThriftAnnotations = {};
    public readonly _fieldAnnotations: thrift.IFieldAnnotations = {};
    constructor(args: IProductCardArgs = {}) {
        super();
        if (args.title != null) {
            const value_4: string = args.title;
            this.title = value_4;
        }
        if (args.subtitle != null) {
            const value_5: string = args.subtitle;
            this.subtitle = value_5;
        }
        if (args.imageUrl != null) {
            const value_6: string = args.imageUrl;
            this.imageUrl = value_6;
        }
    }
    public static read(input: thrift.TProtocol): ProductCard {
        return new ProductCard(ProductCardCodec.decode(input));
    }
    public static write(args: IProductCardArgs, output: thrift.TProtocol): void {
        return ProductCardCodec.encode(args, output);
    }
    public write(output: thrift.TProtocol): void {
        return ProductCardCodec.encode(this, output);
    }
}