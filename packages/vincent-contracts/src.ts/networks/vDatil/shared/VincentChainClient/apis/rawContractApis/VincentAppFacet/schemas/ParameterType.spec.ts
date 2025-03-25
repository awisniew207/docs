import { hexEncodedParameterValueSchema } from './ParameterType';

describe('hexEncodedParameterValueSchema', () => {
  it('should correctly encode different parameter types', () => {
    const input = [
      [
        [
          // INT256
          -1000000000000000000n,
          // INT256_ARRAY
          [-1000000000000000000n, 2000000000000000000n],
          // UINT256
          1000000000000000000n,
          // UINT256_ARRAY
          [1000000000000000000n, 2000000000000000000n],
          // BOOL
          true,
          // BOOL_ARRAY
          [true, false, true],
          // ADDRESS (already hex)
          '0x1234567890123456789012345678901234567890',
          // ADDRESS_ARRAY (already hex)
          [
            '0x1234567890123456789012345678901234567890',
            '0x0987654321098765432109876543210987654321',
          ],
          // STRING
          'Hello World',
          // STRING_ARRAY
          ['Hello', 'World'],
          // BYTES (already hex)
          '0x1234',
          // BYTES_ARRAY (already hex)
          ['0x1234', '0x5678'],
        ],
      ],
    ];

    const output = hexEncodedParameterValueSchema.parse(input);

    expect(output).toEqual([
      [
        [
          '0xfffffffffffffffffffffffffffffffffffffffffffffffff21f494c589c0000',
          '0x2d313030303030303030303030303030303030302c32303030303030303030303030303030303030',
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          '0x313030303030303030303030303030303030302c32303030303030303030303030303030303030',
          '0x1',
          '0x747275652c66616c73652c74727565',
          '0x1234567890123456789012345678901234567890',
          '0x3078313233343536373839303132333435363738393031323334353637383930313233343536373839302c307830393837363534333231303938373635343332313039383736353433323130393837363534333231',
          '0x48656c6c6f20576f726c64',
          '0x48656c6c6f2c576f726c64',
          '0x1234',
          '0x3078313233342c307835363738',
        ],
      ],
    ]);
  });
});
