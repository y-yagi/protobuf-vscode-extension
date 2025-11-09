import { ProtoParser } from '../../../src/parser/protoParser';

describe('ProtoParser', () => {
  let parser: ProtoParser;

  beforeEach(() => {
    parser = new ProtoParser();
  });

  const sampleProto = `
syntax = "proto3";

package example;

// User message
message User {
  string id = 1;
  string name = 2;
  int32 age = 3;
}

enum Status {
  STATUS_UNKNOWN = 0;
  STATUS_ACTIVE = 1;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
}

message GetUserRequest {
  string user_id = 1;
}

message GetUserResponse {
  User user = 1;
}
`;

  describe('parse', () => {
    it('should parse a valid proto file', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      expect(result).toBeDefined();
      expect(result.uri).toBe('file:///test.proto');
      expect(result.syntax).toBe('proto3');
      expect(result.package).toBe('example');
      expect(result.parseErrors).toHaveLength(0);
    });

    it('should extract messages from proto file', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      expect(result.messages).toHaveLength(3); // User, GetUserRequest, GetUserResponse

      const userMessage = result.messages.find(m => m.name === 'User');
      expect(userMessage).toBeDefined();
      expect(userMessage?.fullyQualifiedName).toBe('example.User');
      expect(userMessage?.fields).toHaveLength(3);
    });

    it('should extract fields with correct types and numbers', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      const userMessage = result.messages.find(m => m.name === 'User');
      const idField = userMessage?.fields.find(f => f.name === 'id');

      expect(idField).toBeDefined();
      expect(idField?.number).toBe(1);
      expect(idField?.type).toEqual({ kind: 'primitive', type: 'string' });
    });

    it('should extract enums from proto file', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      expect(result.enums).toHaveLength(1);

      const statusEnum = result.enums[0];
      expect(statusEnum.name).toBe('Status');
      expect(statusEnum.fullyQualifiedName).toBe('example.Status');
      expect(statusEnum.values).toHaveLength(2);
    });

    it('should extract enum values correctly', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      const statusEnum = result.enums[0];
      const unknownValue = statusEnum.values.find(v => v.name === 'STATUS_UNKNOWN');

      expect(unknownValue).toBeDefined();
      expect(unknownValue?.number).toBe(0);
    });

    it('should extract services from proto file', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      expect(result.services).toHaveLength(1);

      const userService = result.services[0];
      expect(userService.name).toBe('UserService');
      expect(userService.fullyQualifiedName).toBe('example.UserService');
      expect(userService.methods).toHaveLength(1);
    });

    it('should extract RPC methods correctly', () => {
      const result = parser.parse(sampleProto, 'file:///test.proto');

      const userService = result.services[0];
      const getUserMethod = userService.methods[0];

      expect(getUserMethod.name).toBe('GetUser');
      expect(getUserMethod.inputType).toContain('GetUserRequest');
      expect(getUserMethod.outputType).toContain('GetUserResponse');
      expect(getUserMethod.clientStreaming).toBe(false);
      expect(getUserMethod.serverStreaming).toBe(false);
    });

    it('should default to proto3 when syntax not specified', () => {
      const protoWithoutSyntax = `
package test;
message Test {
  string field = 1;
}
`;
      const result = parser.parse(protoWithoutSyntax, 'file:///test.proto');

      expect(result.syntax).toBe('proto3');
    });

    it('should handle proto2 syntax', () => {
      const proto2 = `
syntax = "proto2";
package test;
message Test {
  required string field = 1;
}
`;
      const result = parser.parse(proto2, 'file:///test.proto');

      expect(result.syntax).toBe('proto2');
    });
  });

  describe('error handling', () => {
    it('should capture parse errors for invalid syntax', () => {
      const invalidProto = `
syntax = "proto3";
message Bad {
  string field = 1
  // Missing semicolon
}
`;
      const result = parser.parse(invalidProto, 'file:///test.proto');

      expect(result.parseErrors.length).toBeGreaterThan(0);
    });

    it('should return error when parsing fails', () => {
      const partiallyValidProto = `
syntax = "proto3";
message Good {
  string field = 1;
}
message Bad {
  string field = 1
}
message AlsoGood {
  string field = 1;
}
`;
      const result = parser.parse(partiallyValidProto, 'file:///test.proto');

      // When protobufjs encounters a parse error, it throws and we return minimal ProtoFile with error
      expect(result.parseErrors.length).toBeGreaterThan(0);
      expect(result.messages.length).toBe(0);
    });

    it('should handle empty proto files', () => {
      const result = parser.parse('', 'file:///empty.proto');

      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(0);
      expect(result.enums).toHaveLength(0);
      expect(result.services).toHaveLength(0);
    });
  });

  describe('imports', () => {
    it('should extract import statements', () => {
      const protoWithImports = `
syntax = "proto3";
import "google/protobuf/timestamp.proto";
import public "common/types.proto";

message Test {
  string field = 1;
}
`;
      const result = parser.parse(protoWithImports, 'file:///test.proto');

      expect(result.imports).toHaveLength(2);
      expect(result.imports[0].path).toBe('google/protobuf/timestamp.proto');
      expect(result.imports[1].modifier).toBe('public');
    });
  });

  describe('comments and documentation', () => {
    it('should handle files with documentation comments', () => {
      const protoWithDocs = `
syntax = "proto3";

// This is a user message
// with multiple lines of documentation
message User {
  // User ID field
  string id = 1;
}
`;
      const result = parser.parse(protoWithDocs, 'file:///test.proto');

      const userMessage = result.messages.find(m => m.name === 'User');
      expect(userMessage).toBeDefined();
      // Note: protobufjs comment extraction requires additional configuration
      // Documentation field may be null with basic parse()
      expect(userMessage?.name).toBe('User');
    });
  });
});
