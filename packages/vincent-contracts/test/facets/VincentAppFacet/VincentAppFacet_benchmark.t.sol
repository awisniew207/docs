// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../helpers/VincentTestHelper.sol";
import "../../../src/VincentBase.sol";
import "../../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentAppFacetBenchmark
 * @notice Benchmark tests for VincentAppFacet
 * @dev Tests gas costs for app registration operations
 */
contract VincentAppFacetBenchmark is VincentTestHelper {
    function setUp() public override {
        super.setUp();
    }

    /**
     * @notice Benchmark registering an app with a single tool and policy
     * @dev Measures gas costs for basic app registration
     */
    function testBenchmarkRegisterAppSingleTool() public {
        vm.startPrank(deployer);

        // Create minimal test data for a single tool and policy
        string[] memory singleToolIpfsCids = new string[](1);
        singleToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory singleToolPolicies = new string[][](1);
        singleToolPolicies[0] = new string[](1);
        singleToolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory singleToolParamNames = new string[][][](1);
        singleToolParamNames[0] = new string[][](1);
        singleToolParamNames[0][0] = new string[](1);
        singleToolParamNames[0][0][0] = TEST_POLICY_PARAM_1;

        VincentAppStorage.ParameterType[][][] memory singleToolParamTypes = new VincentAppStorage.ParameterType[][][](1);
        singleToolParamTypes[0] = new VincentAppStorage.ParameterType[][](1);
        singleToolParamTypes[0][0] = new VincentAppStorage.ParameterType[](1);
        singleToolParamTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;

        // Measure gas for app registration
        uint256 gasStart = gasleft();

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            singleToolIpfsCids,
            singleToolPolicies,
            singleToolParamNames,
            singleToolParamTypes
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log("Gas used for registering app with single tool and policy:", gasUsed);
        console.log("App ID:", appId);
        console.log("Version number:", versionNumber);

        // Verify the registration was successful
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        vm.stopPrank();
    }

    /**
     * @notice Benchmark registering an app with a single tool, single policy, and three policy parameters
     * @dev Measures gas costs for app registration with multiple policy parameters
     */
    function testBenchmarkRegisterAppSingleToolThreeParams() public {
        vm.startPrank(deployer);

        // Create test data for a single tool and policy with three parameters
        string[] memory singleToolIpfsCids = new string[](1);
        singleToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory singleToolPolicies = new string[][](1);
        singleToolPolicies[0] = new string[](1);
        singleToolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory singleToolParamNames = new string[][][](1);
        singleToolParamNames[0] = new string[][](1);
        singleToolParamNames[0][0] = new string[](3);
        singleToolParamNames[0][0][0] = "param1";
        singleToolParamNames[0][0][1] = "param2";
        singleToolParamNames[0][0][2] = "param3";

        VincentAppStorage.ParameterType[][][] memory singleToolParamTypes = new VincentAppStorage.ParameterType[][][](1);
        singleToolParamTypes[0] = new VincentAppStorage.ParameterType[][](1);
        singleToolParamTypes[0][0] = new VincentAppStorage.ParameterType[](3);
        singleToolParamTypes[0][0][0] = VincentAppStorage.ParameterType.STRING;
        singleToolParamTypes[0][0][1] = VincentAppStorage.ParameterType.UINT256;
        singleToolParamTypes[0][0][2] = VincentAppStorage.ParameterType.BOOL;

        // Measure gas for app registration
        uint256 gasStart = gasleft();

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            singleToolIpfsCids,
            singleToolPolicies,
            singleToolParamNames,
            singleToolParamTypes
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log("Gas used for registering app with single tool, single policy, and three parameters:", gasUsed);
        console.log("App ID:", appId);
        console.log("Version number:", versionNumber);

        // Verify the registration was successful
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        // Verify the policy parameters were correctly registered
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertEq(versionData.tools[0].policies[0].parameterNames.length, 3, "Should have 3 parameter names");
        assertEq(versionData.tools[0].policies[0].parameterTypes.length, 3, "Should have 3 parameter types");

        vm.stopPrank();
    }

    /**
     * @notice Benchmark registering an app with three tools, each with a policy and three parameters
     * @dev Measures gas costs for app registration with multiple tools and policies
     */
    function testBenchmarkRegisterAppThreeTools() public {
        vm.startPrank(deployer);

        // Create test data for three tools, each with a policy and three parameters
        string[] memory threeToolIpfsCids = new string[](3);
        threeToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;
        threeToolIpfsCids[1] = TEST_TOOL_IPFS_CID_2;
        threeToolIpfsCids[2] = TEST_TOOL_IPFS_CID_3;

        string[][] memory threeToolPolicies = new string[][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolPolicies[i] = new string[](1);
            threeToolPolicies[i][0] = TEST_POLICY_1;
        }

        string[][][] memory threeToolParamNames = new string[][][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolParamNames[i] = new string[][](1);
            threeToolParamNames[i][0] = new string[](3);
            threeToolParamNames[i][0][0] = "param1";
            threeToolParamNames[i][0][1] = "param2";
            threeToolParamNames[i][0][2] = "param3";
        }

        VincentAppStorage.ParameterType[][][] memory threeToolParamTypes = new VincentAppStorage.ParameterType[][][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolParamTypes[i] = new VincentAppStorage.ParameterType[][](1);
            threeToolParamTypes[i][0] = new VincentAppStorage.ParameterType[](3);
            threeToolParamTypes[i][0][0] = VincentAppStorage.ParameterType.STRING;
            threeToolParamTypes[i][0][1] = VincentAppStorage.ParameterType.UINT256;
            threeToolParamTypes[i][0][2] = VincentAppStorage.ParameterType.BOOL;
        }

        // Measure gas for app registration
        uint256 gasStart = gasleft();

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            threeToolIpfsCids,
            threeToolPolicies,
            threeToolParamNames,
            threeToolParamTypes
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log("Gas used for registering app with three tools, each with a policy and three parameters:", gasUsed);
        console.log("App ID:", appId);
        console.log("Version number:", versionNumber);

        // Verify the registration was successful
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        // Verify the tools and their policies were correctly registered
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertEq(versionData.tools.length, 3, "Should have 3 tools");

        // Verify each tool has a policy with three parameters
        for (uint256 i = 0; i < 3; i++) {
            assertEq(
                versionData.tools[i].policies[0].parameterNames.length, 3, "Each tool should have 3 parameter names"
            );
            assertEq(
                versionData.tools[i].policies[0].parameterTypes.length, 3, "Each tool should have 3 parameter types"
            );
        }

        vm.stopPrank();
    }

    /**
     * @notice Benchmark registering an app with three tools, each with three policies and five parameters
     * @dev Measures gas costs for app registration with multiple tools, policies, and parameters
     */
    function testBenchmarkRegisterAppThreeToolsThreePoliciesFiveParams() public {
        vm.startPrank(deployer);

        // Create test data for three tools, each with three policies and five parameters
        string[] memory threeToolIpfsCids = new string[](3);
        threeToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;
        threeToolIpfsCids[1] = TEST_TOOL_IPFS_CID_2;
        threeToolIpfsCids[2] = TEST_TOOL_IPFS_CID_3;

        string[][] memory threeToolPolicies = new string[][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolPolicies[i] = new string[](1);
            threeToolPolicies[i][0] = i == 0 ? TEST_POLICY_1 : TEST_POLICY_2;
        }

        string[][][] memory threeToolParamNames = new string[][][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolParamNames[i] = new string[][](1);
            threeToolParamNames[i][0] = new string[](5);
            for (uint256 k = 0; k < 5; k++) {
                threeToolParamNames[i][0][k] = string(abi.encodePacked("param", k + 1));
            }
        }

        VincentAppStorage.ParameterType[][][] memory threeToolParamTypes = new VincentAppStorage.ParameterType[][][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolParamTypes[i] = new VincentAppStorage.ParameterType[][](1);
            threeToolParamTypes[i][0] = new VincentAppStorage.ParameterType[](5);
            threeToolParamTypes[i][0][0] = VincentAppStorage.ParameterType.STRING;
            threeToolParamTypes[i][0][1] = VincentAppStorage.ParameterType.UINT256;
            threeToolParamTypes[i][0][2] = VincentAppStorage.ParameterType.BOOL;
            threeToolParamTypes[i][0][3] = VincentAppStorage.ParameterType.ADDRESS;
            threeToolParamTypes[i][0][4] = VincentAppStorage.ParameterType.BYTES;
        }

        // Measure gas for app registration
        uint256 gasStart = gasleft();

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            threeToolIpfsCids,
            threeToolPolicies,
            threeToolParamNames,
            threeToolParamTypes
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log(
            "Gas used for registering app with three tools, three policies per tool, and five parameters per policy:",
            gasUsed
        );
        console.log("App ID:", appId);
        console.log("Version number:", versionNumber);

        // Verify the registration was successful
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        // Verify the tools and their policies were correctly registered
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertEq(versionData.tools.length, 3, "Should have 3 tools");

        // Verify each tool has a policy with five parameters
        for (uint256 i = 0; i < 3; i++) {
            assertEq(versionData.tools[i].policies.length, 1, "Each tool should have 1 policy");
            assertEq(
                versionData.tools[i].policies[0].parameterNames.length, 5, "Each policy should have 5 parameter names"
            );
            assertEq(
                versionData.tools[i].policies[0].parameterTypes.length, 5, "Each policy should have 5 parameter types"
            );
        }

        vm.stopPrank();
    }

    /**
     * @notice Benchmark registering an app with one tool, one policy, and all array parameter types
     * @dev Measures gas costs for app registration with array parameter types
     */
    function testBenchmarkRegisterAppSingleToolArrayParams() public {
        vm.startPrank(deployer);

        // Create test data for a single tool and policy with array parameters
        string[] memory singleToolIpfsCids = new string[](1);
        singleToolIpfsCids[0] = TEST_TOOL_IPFS_CID_1;

        string[][] memory singleToolPolicies = new string[][](1);
        singleToolPolicies[0] = new string[](1);
        singleToolPolicies[0][0] = TEST_POLICY_1;

        string[][][] memory singleToolParamNames = new string[][][](1);
        singleToolParamNames[0] = new string[][](1);
        singleToolParamNames[0][0] = new string[](6); // 6 array parameter types
        singleToolParamNames[0][0][0] = "int256Array";
        singleToolParamNames[0][0][1] = "uint256Array";
        singleToolParamNames[0][0][2] = "boolArray";
        singleToolParamNames[0][0][3] = "addressArray";
        singleToolParamNames[0][0][4] = "stringArray";
        singleToolParamNames[0][0][5] = "bytesArray";

        VincentAppStorage.ParameterType[][][] memory singleToolParamTypes = new VincentAppStorage.ParameterType[][][](1);
        singleToolParamTypes[0] = new VincentAppStorage.ParameterType[][](1);
        singleToolParamTypes[0][0] = new VincentAppStorage.ParameterType[](6);
        singleToolParamTypes[0][0][0] = VincentAppStorage.ParameterType.INT256_ARRAY;
        singleToolParamTypes[0][0][1] = VincentAppStorage.ParameterType.UINT256_ARRAY;
        singleToolParamTypes[0][0][2] = VincentAppStorage.ParameterType.BOOL_ARRAY;
        singleToolParamTypes[0][0][3] = VincentAppStorage.ParameterType.ADDRESS_ARRAY;
        singleToolParamTypes[0][0][4] = VincentAppStorage.ParameterType.STRING_ARRAY;
        singleToolParamTypes[0][0][5] = VincentAppStorage.ParameterType.BYTES_ARRAY;

        // Measure gas for app registration
        uint256 gasStart = gasleft();

        (uint256 appId, uint256 versionNumber) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            singleToolIpfsCids,
            singleToolPolicies,
            singleToolParamNames,
            singleToolParamTypes
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log("Gas used for registering app with single tool and array parameters:", gasUsed);
        console.log("App ID:", appId);
        console.log("Version number:", versionNumber);

        // Verify the registration was successful
        assertEq(appId, 1, "App ID should be 1");
        assertEq(versionNumber, 1, "App version should be 1");

        // Verify the policy parameters were correctly registered
        (VincentAppViewFacet.App memory app, VincentAppViewFacet.AppVersion memory versionData) =
            wrappedAppViewFacet.getAppVersion(appId, versionNumber);
        assertEq(versionData.tools[0].policies[0].parameterNames.length, 6, "Should have 6 parameter names");
        assertEq(versionData.tools[0].policies[0].parameterTypes.length, 6, "Should have 6 parameter types");

        // Verify each parameter type is correct
        assertEq(
            uint256(versionData.tools[0].policies[0].parameterTypes[0]),
            uint256(VincentAppStorage.ParameterType.INT256_ARRAY),
            "First parameter should be INT256_ARRAY"
        );
        assertEq(
            uint256(versionData.tools[0].policies[0].parameterTypes[1]),
            uint256(VincentAppStorage.ParameterType.UINT256_ARRAY),
            "Second parameter should be UINT256_ARRAY"
        );
        assertEq(
            uint256(versionData.tools[0].policies[0].parameterTypes[2]),
            uint256(VincentAppStorage.ParameterType.BOOL_ARRAY),
            "Third parameter should be BOOL_ARRAY"
        );
        assertEq(
            uint256(versionData.tools[0].policies[0].parameterTypes[3]),
            uint256(VincentAppStorage.ParameterType.ADDRESS_ARRAY),
            "Fourth parameter should be ADDRESS_ARRAY"
        );
        assertEq(
            uint256(versionData.tools[0].policies[0].parameterTypes[4]),
            uint256(VincentAppStorage.ParameterType.STRING_ARRAY),
            "Fifth parameter should be STRING_ARRAY"
        );
        assertEq(
            uint256(versionData.tools[0].policies[0].parameterTypes[5]),
            uint256(VincentAppStorage.ParameterType.BYTES_ARRAY),
            "Sixth parameter should be BYTES_ARRAY"
        );

        vm.stopPrank();
    }
}
