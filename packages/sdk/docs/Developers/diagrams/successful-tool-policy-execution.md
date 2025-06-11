Title: Vincent Tool & Policy Successful Execution

Vincent App User -> Vincent App: Performs an action that triggers the execution of a Vincent Tool

Vincent App => Vincent App Delegatee: Signals execution of a Vincent Tool for a specific Vincent App User is needed

Vincent App Delegatee -> Vincent App Delegatee: Collects required information to execute the `precheck` functions for the Vincent Tool and all of it's registered Vincent Policies

Vincent App Delegatee -> Vincent Tool: Executes the Vincent Tool's `precheck` function

Vincent Tool -> Vincent Policy: Executes the `precheck` function for each Vincent Policy supported by the Vincent Tool that the Vincent App User has opted into using

Vincent Policy -> Vincent Tool: Each Vincent Policy returns an `allow` result based on it's `precheck` logic

Vincent Tool -> Vincent Tool: The Vincent Tool executes it's `precheck` logic

Vincent App Delegatee -> Vincent Tool: The Vincent App Delegatee executes the tool's `execute` function

Vincent Tool -> Vincent Policy: Executes the `evaluate` function for each Vincent Policy supported by the Vincent Tool that the Vincent App User has opted into using

Vincent Policy -> Vincent Tool: Each Vincent Policy returns an `allow` or `deny` result based on it's `evaluate` logic

Vincent Tool -> Vincent Tool: The Vincent Tool's `execute` logic executes

Vincent Tool -> Vincent Policy: The Vincent Tool executes each Vincent Policy's `commit`

Vincent Policy -> Vincent Tool: Each Vincent Policy returns an `allow` or `deny` result based on it's `commit` logic

Vincent Tool -> Vincent App Delegatee: Returns the collected Vincent Policy `allow` results from the `evalaute` functions, the Vincent Tool's `execute` `success` result, and the collected `allow` results from all the executed Vincent Policy `commit` functions

Vincent App Delegatee -> Vincent App: Returns success message with any Vincent Tool execution details such as transaction hashes

Vincent App -> Vincent App User: Displays a success message detailing the successful execution of their desired action
