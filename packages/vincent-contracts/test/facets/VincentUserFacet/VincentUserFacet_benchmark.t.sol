// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../../helpers/VincentTestHelper.sol";
import "../../../src/VincentBase.sol";
import "../../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentUserFacetBenchmark
 * @notice Benchmark tests for VincentUserFacet
 * @dev Tests gas costs for app version permitting operations
 */
contract VincentUserFacetBenchmark is VincentTestHelper {
    // App ID and version for tests
    uint256 appId;
    uint256 appVersion;

    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();
    }

    /**
     * @notice Benchmark permitting an app version with a single tool and policy
     * @dev Measures gas costs for basic app version permitting
     */
    function testBenchmarkPermitAppVersionSingleTool() public {
        vm.startPrank(deployer);

        // Register app with single tool and policy
        (appId, appVersion) = _registerTestApp();

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

        bytes[][][] memory singleToolParamValues = new bytes[][][](1);
        singleToolParamValues[0] = new bytes[][](1);
        singleToolParamValues[0][0] = new bytes[](1);
        singleToolParamValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);

        // Measure gas for app version permitting
        uint256 gasStart = gasleft();

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            singleToolIpfsCids,
            singleToolPolicies,
            singleToolParamNames,
            singleToolParamValues
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log("Gas used for permitting app version with single tool and policy:", gasUsed);

        // Verify the app version was permitted
        uint256 permittedVersion = wrappedUserViewFacet.getPermittedAppVersionForPkp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(permittedVersion, appVersion, "App version should be permitted");

        vm.stopPrank();
    }

    /**
     * @notice Benchmark permitting an app version with a single tool, single policy, and three parameters
     * @dev Measures gas costs for app version permitting with multiple policy parameters
     */
    function testBenchmarkPermitAppVersionSingleToolThreeParams() public {
        vm.startPrank(deployer);

        // Register app with single tool and policy with three parameters
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

        (appId, appVersion) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            singleToolIpfsCids,
            singleToolPolicies,
            singleToolParamNames,
            singleToolParamTypes
        );

        bytes[][][] memory singleToolParamValues = new bytes[][][](1);
        singleToolParamValues[0] = new bytes[][](1);
        singleToolParamValues[0][0] = new bytes[](3);
        singleToolParamValues[0][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);
        singleToolParamValues[0][0][1] = abi.encode(TEST_POLICY_PARAM_UINT256_VALUE);
        singleToolParamValues[0][0][2] = abi.encode(TEST_POLICY_PARAM_BOOL_VALUE);

        // Measure gas for app version permitting
        uint256 gasStart = gasleft();

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            singleToolIpfsCids,
            singleToolPolicies,
            singleToolParamNames,
            singleToolParamValues
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log(
            "Gas used for permitting app version with single tool, single policy, and three parameters:", gasUsed
        );

        // Verify the app version was permitted
        uint256 permittedVersion = wrappedUserViewFacet.getPermittedAppVersionForPkp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(permittedVersion, appVersion, "App version should be permitted");

        // Verify the policy parameters were correctly set
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(toolsAndPolicies[0].policies[0].parameters.length, 3, "Should have 3 parameters");

        vm.stopPrank();
    }

    /**
     * @notice Benchmark permitting an app version with three tools, each with a policy and three parameters
     * @dev Measures gas costs for app version permitting with multiple tools and policies
     */
    function testBenchmarkPermitAppVersionThreeTools() public {
        vm.startPrank(deployer);

        // Register app with three tools, each with a policy and three parameters
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

        (appId, appVersion) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            threeToolIpfsCids,
            threeToolPolicies,
            threeToolParamNames,
            threeToolParamTypes
        );

        bytes[][][] memory threeToolParamValues = new bytes[][][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolParamValues[i] = new bytes[][](1);
            threeToolParamValues[i][0] = new bytes[](3);
            threeToolParamValues[i][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);
            threeToolParamValues[i][0][1] = abi.encode(TEST_POLICY_PARAM_UINT256_VALUE);
            threeToolParamValues[i][0][2] = abi.encode(TEST_POLICY_PARAM_BOOL_VALUE);
        }

        // Measure gas for app version permitting
        uint256 gasStart = gasleft();

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            threeToolIpfsCids,
            threeToolPolicies,
            threeToolParamNames,
            threeToolParamValues
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log(
            "Gas used for permitting app version with three tools, each with a policy and three parameters:", gasUsed
        );

        // Verify the app version was permitted
        uint256 permittedVersion = wrappedUserViewFacet.getPermittedAppVersionForPkp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(permittedVersion, appVersion, "App version should be permitted");

        // Verify the tools and their policies were correctly set
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(toolsAndPolicies.length, 3, "Should have 3 tools");

        // Verify each tool has a policy with three parameters
        for (uint256 i = 0; i < 3; i++) {
            assertEq(toolsAndPolicies[i].policies[0].parameters.length, 3, "Each tool should have 3 parameters");
        }

        vm.stopPrank();
    }

    /**
     * @notice Benchmark permitting an app version with three tools, each with a policy and five parameters
     * @dev Measures gas costs for app version permitting with multiple tools and parameters
     */
    function testBenchmarkPermitAppVersionThreeToolsFiveParams() public {
        vm.startPrank(deployer);

        // Register app with three tools, each with a policy and five parameters
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

        (appId, appVersion) = wrappedAppFacet.registerApp(
            TEST_APP_NAME,
            TEST_APP_DESCRIPTION,
            testRedirectUris,
            testDelegatees,
            threeToolIpfsCids,
            threeToolPolicies,
            threeToolParamNames,
            threeToolParamTypes
        );

        bytes[][][] memory threeToolParamValues = new bytes[][][](3);
        for (uint256 i = 0; i < 3; i++) {
            threeToolParamValues[i] = new bytes[][](1);
            threeToolParamValues[i][0] = new bytes[](5);
            threeToolParamValues[i][0][0] = abi.encode(TEST_POLICY_PARAM_STRING_VALUE);
            threeToolParamValues[i][0][1] = abi.encode(TEST_POLICY_PARAM_UINT256_VALUE);
            threeToolParamValues[i][0][2] = abi.encode(TEST_POLICY_PARAM_BOOL_VALUE);
            threeToolParamValues[i][0][3] = abi.encode(TEST_POLICY_PARAM_ADDRESS_VALUE);
            threeToolParamValues[i][0][4] = abi.encode(TEST_POLICY_PARAM_BYTES_VALUE);
        }

        // Measure gas for app version permitting
        uint256 gasStart = gasleft();

        wrappedUserFacet.permitAppVersion(
            TEST_PKP_TOKEN_ID_1,
            appId,
            appVersion,
            threeToolIpfsCids,
            threeToolPolicies,
            threeToolParamNames,
            threeToolParamValues
        );

        uint256 gasUsed = gasStart - gasleft();

        // Log the results
        console.log(
            "Gas used for permitting app version with three tools, each with a policy and five parameters:", gasUsed
        );

        // Verify the app version was permitted
        uint256 permittedVersion = wrappedUserViewFacet.getPermittedAppVersionForPkp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(permittedVersion, appVersion, "App version should be permitted");

        // Verify the tools and their policies were correctly set
        VincentUserViewFacet.ToolWithPolicies[] memory toolsAndPolicies =
            wrappedUserViewFacet.getAllToolsAndPoliciesForApp(TEST_PKP_TOKEN_ID_1, appId);
        assertEq(toolsAndPolicies.length, 3, "Should have 3 tools");

        // Verify each tool has a policy with five parameters
        for (uint256 i = 0; i < 3; i++) {
            assertEq(toolsAndPolicies[i].policies[0].parameters.length, 5, "Each tool should have 5 parameters");
        }

        vm.stopPrank();
    }
}
