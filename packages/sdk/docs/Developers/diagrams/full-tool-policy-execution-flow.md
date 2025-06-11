Title: Vincent Tool & Policy Execution

Vincent App User -> Vincent App: Performs an action that triggers the execution of a Vincent Tool

Vincent App => Vincent App Delegatee: Signals execution of a Vincent Tool for a specific Vincent App User is needed

Vincent App Delegatee -> Vincent App Delegatee: Collects required information to execute the `precheck` functions for the Vincent Tool and all of it's registered Vincent Policies

Vincent App Delegatee -> Vincent Tool: Executes the Vincent Tool's `precheck` function

Vincent Tool -> Vincent Policy: Executes the `precheck` function for each Vincent Policy supported by the Vincent Tool that the Vincent App User has opted into using

Vincent Policy -> Vincent Tool: Each Vincent Policy returns an `allow` or `deny` result based on it's `precheck` logic

if: A Vincent Policy's `precheck` function returned a `deny` result

Vincent Tool -> Vincent App Delegatee: The collected Vincent Policy results are returned with the `deny` result of the first policy to fail it's `precheck` validation
  
Vincent App Delegatee -> Vincent App: Returns an error message detailing why Vincent Tool execution isn't permitted by the denying Vincent Policy

Vincent App -> Vincent App User: Displays error message detailing why the action cannot be performed

note Vincent App User, Vincent Policy: The flow would stop here as the Vincent App is not permitted by a Vincent Policy to execute the Vincent Tool on behalf of the specific Vincent App User

end

note Vincent App User, Vincent Policy: The execution flow continues if all Vincent Policies returned an `allow` result for their `precheck` functions:

Vincent Tool -> Vincent Tool: The Vincent Tool executes it's `precheck` logic

if: The Vincent Tool's `precheck` function returned a `fail` result

Vincent Tool -> Vincent App Delegatee: Returns the collected Vincent Policy `allow` results, and the Vincent Tool's `precheck` `fail` result
  
Vincent App Delegatee -> Vincent App: Returns an error message detailing why the Vincent Tool execution will fail

Vincent App -> Vincent App User: Displays error message detailing why the action cannot be performed

note Vincent App User, Vincent Policy: The flow would stop here as the Vincent App would not execute the Vincent Tool if it's going to fail

end

note Vincent App User, Vincent Policy: The execution flow continues if all Vincent Policies returned an `allow` result **AND** the Vincent Tool's `precheck` returned `success`:

Vincent App Delegatee -> Vincent Tool: The Vincent App Delegatee executes the tool's `execute` function

Vincent Tool -> Vincent Policy: Executes the `evaluate` function for each Vincent Policy supported by the Vincent Tool that the Vincent App User has opted into using

Vincent Policy -> Vincent Tool: Each Vincent Policy returns an `allow` or `deny` result based on it's `evaluate` logic

if: A Vincent Policy's `evaluate` function returned a `deny` result

Vincent Tool -> Vincent App Delegatee: The collected Vincent Policy results are returned with the `deny` result of the first policy to fail it's `evaluate` validation
  
Vincent App Delegatee -> Vincent App: Returns an error message detailing why Vincent Tool execution isn't permitted by the denying Vincent Policy

Vincent App -> Vincent App User: Displays error message detailing why the action cannot be performed

note Vincent App User, Vincent Policy: The flow would stop here as the Vincent App is not permitted by a Vincent Policy to execute the Vincent Tool on behalf of the specific Vincent App User

end

note Vincent App User, Vincent Policy: The execution flow continues if all Vincent Policies returned an `allow` result for their `evaluate` functions:

Vincent Tool -> Vincent Tool: The Vincent Tool's `execute` logic executes

if: The Vincent Tool's `execute` function returned a `fail` result

Vincent Tool -> Vincent App Delegatee: Returns the collected Vincent Policy `allow` results, and the Vincent Tool's `execute` `fail` result
  
Vincent App Delegatee -> Vincent App: Returns an error message detailing why the Vincent Tool execution failed

Vincent App -> Vincent App User: Displays error message detailing why the action cannot be performed

note Vincent App User, Vincent Policy: The flow would stop here as the Vincent Tool failed to execute

end

note Vincent App User, Vincent Policy: The execution flow continues if all Vincent Policies returned an `allow` result **AND** the Vincent Tool's `execute` returned `success`:

Vincent Tool -> Vincent Policy: The Vincent Tool executes each Vincent Policy's `commit`

note A Vincent Policy `commit` function is optional, and not every policy is expected to have one

Vincent Policy -> Vincent Tool: Each Vincent Policy returns an `allow` or `deny` result based on it's `commit` logic

if: A Vincent Policy's `commit` function returned a `deny` result

Vincent Tool -> Vincent App Delegatee: Returns the collected Vincent Policy `allow` results from the `evaulate` functions, the Vincent Tool's `execute` `success` result, the collected Vincent Policy `allow` results from the `commit` functions, and the `deny` result from the denying Vincent Policy `commit` function
  
Vincent App Delegatee -> Vincent App: Returns an error message detailing that Vincent Tool execution was successful, but there was an error in one of the Vincent Policy's `commit` functions

Vincent App -> Vincent App User: Displays error message detailing why the action wasn't performed successfully

note Vincent App User, Vincent Policy: The flow would stop here as the Vincent Tool executed successfully, but one of the Vincent Policy's failed to commit. At this point there is likely some reconciliation to take place, like retrying the Policy's `commit` function

end

note Vincent App User, Vincent Policy: The execution flow continues if all Vincent Policy `commit` functions returned an `allow` result:

Vincent Tool -> Vincent App Delegatee: Returns the collected Vincent Policy `allow` results from the `evalaute` functions, the Vincent Tool's `execute` `success` result, and the collected `allow` results from all the executed Vincent Policy `commit` functions

Vincent App Delegatee -> Vincent App: Returns success message with any Vincent Tool execution details such as transaction hashes

Vincent App -> Vincent App User: Displays a success message detailing the successful execution of their desired action
