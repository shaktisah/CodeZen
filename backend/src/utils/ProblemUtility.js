const axios = require('axios');

const getLanguageById = (lang) => {
    const language = {
        "c++": "cpp",
        "java": "java",
        "javascript": "javascript",
        "python": "python"
    };

    return language[lang ? lang.toLowerCase() : ''] || lang;
};

const submitBatch = async (submissions) => {
    try {
        const results = [];
        for (const sub of submissions) {
            const response = await axios.post(
                'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
                {
                    language: sub.language,
                    stdin: sub.stdin,
                    files: sub.files
                },
                {
                    headers: {
                        'content-type': 'application/json',
                        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                        'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'onecompiler-apis.p.rapidapi.com'
                    }
                }
            );
            results.push(response.data);
            
            // Wait 1.1 seconds between requests to avoid RapidAPI rate limits (1 req/sec)
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
        return results;
    } catch (error) {
        console.error("Error executing batch in OneCompiler:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to execute batch code submission");
    }
};

function parseInput(inputStr) {
    if (!inputStr) return { vars: [], argNames: '' };
    
    // Split input on commas that are followed by a variable assignment (e.g. ", target =")
    const assignmentRegex = /,(\s*)(?=[a-zA-Z_][a-zA-Z0-9_]*\s*=)/g;
    const rawAssignments = inputStr.split(assignmentRegex).filter(s => s && s.trim().length > 0 && s.includes('='));
    
    const assignments = rawAssignments.length > 0 ? rawAssignments : [inputStr];
    
    const vars = [];
    for (const assign of assignments) {
        const eqIdx = assign.indexOf('=');
        if (eqIdx !== -1) {
            const name = assign.substring(0, eqIdx).trim();
            const val = assign.substring(eqIdx + 1).trim();
            vars.push({ name, val });
        }
    }
    const argNames = vars.map(v => v.name).join(', ');
    return { vars, argNames };
}

const extractFunctionName = (problemOrCode, languageId) => {
    let initialCode = "";
    if (typeof problemOrCode === 'string') {
        initialCode = problemOrCode;
    } else if (problemOrCode && Array.isArray(problemOrCode.startCode)) {
        const startCodeObj = problemOrCode.startCode.find(
            c => c.language.toLowerCase() === languageId.toLowerCase() || 
                 (languageId === 'javascript' && c.language.toLowerCase() === 'js') ||
                 (languageId === 'cpp' && c.language.toLowerCase() === 'c++')
        );
        initialCode = startCodeObj ? startCodeObj.initialCode : "";
    } else if (problemOrCode && typeof problemOrCode === 'object') {
        initialCode = problemOrCode.initialCode || "";
    }

    let funcName = 'solve';
    if (initialCode) {
        let match;
        if (languageId === 'javascript') {
            match = initialCode.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
        } else if (languageId === 'python') {
            match = initialCode.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
        } else if (languageId === 'cpp') {
            match = initialCode.match(/(?:vector<[^>]+>|\w+)\s+([a-zA-Z0-9_]+)\s*\(/);
        } else if (languageId === 'java') {
            match = initialCode.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:\w+(?:\[\])?)\s+([a-zA-Z0-9_]+)\s*\(/);
        }
        if (match && match[1] !== 'main') {
            funcName = match[1];
        }
    }
    return funcName;
};

function buildDriverCode(languageId, code, testInput, funcName) {
    const { vars, argNames } = parseInput(testInput);
    const firstVarName = vars[0]?.name || 'nums';

    if (languageId === 'javascript') {
        const formattedInputs = vars.map(v => `let ${v.name} = ${v.val};`).join('\n');
        return `${code}\n\n${formattedInputs}\nlet _res;\nif (typeof Solution === 'function') {\n    const _solver = new Solution();\n    _res = typeof _solver.${funcName} === 'function' ? _solver.${funcName}(${argNames}) : ${funcName}(${argNames});\n} else if (typeof ${funcName} === 'function') {\n    _res = ${funcName}(${argNames});\n}\nif (_res === undefined && typeof ${firstVarName} !== 'undefined') {\n    _res = ${firstVarName};\n}\nconsole.log(JSON.stringify(_res));`;
    }

    if (languageId === 'python') {
        const pyInputs = vars.map(v => {
            let pyVal = v.val.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None');
            return `${v.name} = ${pyVal}`;
        }).join('\n');

        return `import json\nimport sys\n\n${code}\n\n${pyInputs}\n\n_res = None\ntry:\n    _solver = Solution()\n    if hasattr(_solver, '${funcName}'):\n        _res = getattr(_solver, '${funcName}')(${argNames})\n    else:\n        _res = ${funcName}(${argNames})\nexcept NameError:\n    if '${funcName}' in globals():\n        _res = ${funcName}(${argNames})\n\nif _res is None and '${firstVarName}' in locals():\n    _res = ${firstVarName}\n\nif isinstance(_res, bool):\n    print("true" if _res else "false")\nelif _res is None:\n    print("null")\nelif isinstance(_res, (int, float, str)):\n    if isinstance(_res, str):\n        print(f'"{_res}"')\n    else:\n        print(_res)\nelse:\n    print(json.dumps(_res, separators=(',', ':')))\n`;
    }

    if (languageId === 'cpp') {
        const cppDecls = vars.map(v => {
            let val = v.val.trim();
            if (val.startsWith('[[')) {
                const cppVal = val.replace(/\[/g, '{').replace(/\]/g, '}');
                const type = val.includes('"') ? 'vector<vector<string>>' : 'vector<vector<int>>';
                return `${type} ${v.name} = ${cppVal};`;
            }
            if (val.startsWith('[')) {
                const cppVal = val.replace(/\[/g, '{').replace(/\]/g, '}');
                const type = val.includes('"') ? 'vector<string>' : 'vector<int>';
                return `${type} ${v.name} = ${cppVal};`;
            }
            if (val.startsWith('"')) {
                return `string ${v.name} = ${val};`;
            }
            if (val === 'true' || val === 'false') {
                return `bool ${v.name} = ${val};`;
            }
            if (!isNaN(Number(val))) {
                const type = val.includes('.') ? 'double' : 'int';
                return `${type} ${v.name} = ${val};`;
            }
            return `auto ${v.name} = ${val};`;
        }).join('\n    ');

        const hasSolutionClass = code.includes("class Solution");

        return `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>
#include <cctype>
#include <type_traits>
#include <tuple>

using namespace std;

void printVal(bool val) { cout << (val ? "true" : "false"); }
void printVal(int val) { cout << val; }
void printVal(long long val) { cout << val; }
void printVal(double val) { cout << val; }
void printVal(const string& val) { cout << "\\"" << val << "\\""; }
void printVal(const vector<int>& val) {
    cout << "[";
    for (size_t i = 0; i < val.size(); ++i) {
        if (i > 0) cout << ",";
        cout << val[i];
    }
    cout << "]";
}
void printVal(const vector<string>& val) {
    cout << "[";
    for (size_t i = 0; i < val.size(); ++i) {
        if (i > 0) cout << ",";
        cout << "\\"" << val[i] << "\\"";
    }
    cout << "]";
}
void printVal(const vector<vector<int>>& val) {
    cout << "[";
    for (size_t i = 0; i < val.size(); ++i) {
        if (i > 0) cout << ",";
        printVal(val[i]);
    }
    cout << "]";
}

${code}

template<typename F, typename... Args>
void callAndPrint(F f, Args&&... args) {
    using Ret = invoke_result_t<F, Args...>;
    if constexpr (is_void_v<Ret>) {
        f(forward<Args>(args)...);
        printVal(get<0>(forward_as_tuple(args...)));
    } else {
        auto res = f(forward<Args>(args)...);
        printVal(res);
    }
}

int main() {
    ${cppDecls}
    ${hasSolutionClass ?
        `Solution _solver;\n    callAndPrint([&](auto&&... a){ return _solver.${funcName}(forward<decltype(a)>(a)...); }, ${argNames});` :
        `callAndPrint([&](auto&&... a){ return ${funcName}(forward<decltype(a)>(a)...); }, ${argNames});`
    }
    return 0;
}`;
    }

    if (languageId === 'java') {
        const javaDecls = vars.map(v => {
            let val = v.val.trim();
            if (val.startsWith('[[')) {
                const javaVal = val.replace(/\[/g, 'new int[]{').replace(/\]/g, '}').replace(/^new int\[\}\{/, 'new int[][]{');
                return `int[][] ${v.name} = ${javaVal};`;
            }
            if (val.startsWith('[')) {
                if (val.includes('"')) {
                    const javaVal = val.replace(/\[/g, 'new String[]{').replace(/\]/g, '}');
                    return `String[] ${v.name} = ${javaVal};`;
                }
                const javaVal = val.replace(/\[/g, 'new int[]{').replace(/\]/g, '}');
                return `int[] ${v.name} = ${javaVal};`;
            }
            if (val.startsWith('"')) {
                return `String ${v.name} = ${val};`;
            }
            if (val === 'true' || val === 'false') {
                return `boolean ${v.name} = ${val};`;
            }
            if (!isNaN(Number(val))) {
                const type = val.includes('.') ? 'double' : 'int';
                return `${type} ${v.name} = ${val};`;
            }
            return `Object ${v.name} = ${val};`;
        }).join('\n        ');

        const hasSolutionClass = code.includes("class Solution");

        if (hasSolutionClass) {
            return `import java.util.*;

${code}

public class Main {
    public static void printVal(boolean val) { System.out.print(val ? "true" : "false"); }
    public static void printVal(int val) { System.out.print(val); }
    public static void printVal(double val) { System.out.print(val); }
    public static void printVal(String val) { System.out.print("\\"" + val + "\\""); }
    public static void printVal(int[] val) { System.out.print(Arrays.toString(val).replace(" ", "")); }
    public static void printVal(String[] val) { 
        System.out.print("[");
        for(int i=0; i<val.length; i++) {
            if(i>0) System.out.print(",");
            System.out.print("\\"" + val[i] + "\\"");
        }
        System.out.print("]");
    }
    public static void printVal(List<?> val) { System.out.print(val.toString().replace(" ", "")); }
    public static void printVal(int[][] val) { System.out.print(Arrays.deepToString(val).replace(" ", "")); }
    public static void printVal(Object val) { System.out.print(val); }

    public static void main(String[] args) {
        Solution _solver = new Solution();
        ${javaDecls}
        var _res = _solver.${funcName}(${argNames});
        printVal(_res);
    }
}`;
        } else {
            return `import java.util.*;

public class Main {
    public static void printVal(boolean val) { System.out.print(val ? "true" : "false"); }
    public static void printVal(int val) { System.out.print(val); }
    public static void printVal(double val) { System.out.print(val); }
    public static void printVal(String val) { System.out.print("\\"" + val + "\\""); }
    public static void printVal(int[] val) { System.out.print(Arrays.toString(val).replace(" ", "")); }
    public static void printVal(String[] val) { 
        System.out.print("[");
        for(int i=0; i<val.length; i++) {
            if(i>0) System.out.print(",");
            System.out.print("\\"" + val[i] + "\\"");
        }
        System.out.print("]");
    }
    public static void printVal(List<?> val) { System.out.print(val.toString().replace(" ", "")); }
    public static void printVal(int[][] val) { System.out.print(Arrays.deepToString(val).replace(" ", "")); }
    public static void printVal(Object val) { System.out.print(val); }

    ${code}

    public static void main(String[] args) {
        Main _solver = new Main();
        ${javaDecls}
        var _res = _solver.${funcName}(${argNames});
        printVal(_res);
    }
}`;
        }
    }

    return code;
}

module.exports = { getLanguageById, submitBatch, extractFunctionName, buildDriverCode };
