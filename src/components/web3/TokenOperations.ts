import {BigNumber} from "ethers";

const clearLow = BigNumber.from("0xffffffffffffffffffffffffffffffff00000000000000000000000000000000");
const clearHigh = BigNumber.from("0x00000000000000000000000000000000ffffffffffffffffffffffffffffffff");
const factor = BigNumber.from("0x100000000000000000000000000000000");


const expandNegative128BitCast = (value: BigNumber): BigNumber => {
    if (!value.and(( BigNumber.from(1).shl(127))).eq(BigNumber.from(0))) {
        // return int256(value | clearLow);
        return value.or(clearLow);
    }
    return value;
    // return int256(value);
}

// const _decodeTokenId = (value: BigNumber): [BigNumber:BigNumber] => {
//     return = _unsafeDecodeTokenId(value);
//         // require(
//         //     -1000000 < x && x < 1000000 && -1000000 < y && y < 1000000,
//         //     "The coordinates should be inside bounds"
//         // );
// }

const _unsafeDecodeTokenId = (value: BigNumber): [BigNumber, BigNumber] => {
    const x = expandNegative128BitCast( (value.and(clearLow)).shr(128));
    const y = expandNegative128BitCast(value.and(clearHigh));
    return [x,y];
}

const _encodeTokenId = (x: BigNumber,y: BigNumber): BigNumber => {
    // require(
    //     -1000000 < x && x < 1000000 && -1000000 < y && y < 1000000,
    //     "The coordinates should be inside bounds"
    // );
        return _unsafeEncodeTokenId(x, y);
}

const _unsafeEncodeTokenId = (x: BigNumber, y: BigNumber): BigNumber => {
    return ((x.mul(factor)).and(clearLow)).or(y.and(clearHigh));
}

export const encode = (x: number,y: number): string => {
    return _encodeTokenId(BigNumber.from(x), BigNumber.from(y)).toString()
}

export const decode = (id: number): [string, string] => {
    const [x,y] = _unsafeDecodeTokenId(BigNumber.from(id))
    return [x.toString(), y.toString()]
}