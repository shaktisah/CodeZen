const {getLanguageById,submitBatch,submitToken} = require("../utils/ProblemUtility");
const Problem =require("../models/problem");
const Submission = require("../models/submission");

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator
  } = req.body;

  try {
    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language); 

      
      const ext = languageId === "javascript" ? "js" :
                  languageId === "python" ? "py" :
                  languageId === "java" ? "java" : "cpp";

      // 2. Map test cases to OneCompiler payload structure
      const submission = visibleTestCases.map((testCase) => ({
        language: languageId,
        stdin: testCase.input,
        files: [
          {
            name: `index.${ext}`,
            content: completeCode
          }
        ],
        expectedOutput: testCase.output // Save expected output to compare later
      }));

      const submitResult=await submitBatch(submission);

      const  resultToken=submitResult.map((value)=>value.token);

      const testresult= await submitToken(resultToken);

      
    }

    //we can store it in database.
    const userProblem=await Problem.create({
        ...req.body,
        problemCreator:req.result._id
    });

    res.status(201).send("problem saved sucessfully");
  } catch (err) {
    res.status(400).send("Error:" +err);
  }
};



const updateProblem= async(req,res)=>{


const {id} = req.parsms;
 const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator
  } = req.body;

try {
    if(!id){
      return  res.status(400).send("invalid id");
    }
    
    const DsaProblem=await Problem.findById(id);
    if(!DsaProblem){
        return res.status(404).send("Id is not present in server");
    }

    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language); 

      
      const ext = languageId === "javascript" ? "js" :
                  languageId === "python" ? "py" :
                  languageId === "java" ? "java" : "cpp";

      
      const submission = visibleTestCases.map((testCase) => ({
        language: languageId,
        stdin: testCase.input,
        files: [
          {
            name: `index.${ext}`,
            content: completeCode
          }
        ],
        expectedOutput: testCase.output // Save expected output to compare later
      }));

      const submitResult=await submitBatch(submission);

      const  resultToken=submitResult.map((value)=>value.token);

      const testresult= await submitToken(resultToken);

     
      

    }

    //we can store it in database.
    const userProblem=await Problem.create({
        ...req.body,
        problemCreator:req.result._id
    });

    res.status(201).send("problem saved sucessfully");

  const newProblem =  await Problem.findByIdAndUpdate(id,{...req.body},{runValidators:true,new:true});
  res.status(200).send(newProblem);
  } 
  
  catch (err) {
    res.status(400).send("Error:" +err);
  }


};


const deleteProblem = async(req,res)=>{
       


    const {id}=req.params;
    try{
        if(!id)
        return res.status(400).send("Id is missing");

       const deletedProblem = await Problem.findByIdAndDelete(id);

       if(!deleteProblem)
       return res.status(404).send("problem is missing");

       res.status(200).send("delete sucessfully");

    }
    catch(err){
      res.status(500).send("Erroe:"+err);
    }
}


const  getProblemById = async(req,res)=>{
    const {id}=req.params;

    try{
        if(!id)
        return res.status(400).send("ID is missing");

        const getProblem= await Problem.findById(id.select(' _id title description difficulty tags visibleTestCases startCode referenceSolution'));

        if(!getProblem)
        return res.status(404).send("Problem is Missing");

        res.status(200).send(getProblem);

    }

    catch(err){
        res.status(500).send("Error:"+err);

    }
}

// 2. Get All Problems
const getAllProblem = async (req, res) => {
    try {
        const problems = await Problem.find({})
            .select('_id title difficulty tags');

        return res.status(200).json(problems);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const solvedAllProblemByUser = async (req, res) => {
    try {
        const userId = req.result._id;
        const user = await User.findById(userId).populate({
          path:"problemSolved",
          select:"_id title difficulty tags"
        });
        return res.status(200).send(user.problemSolved);
    } catch (err) {
        return res.status(500).send("Server Error");
    }
};

const submittedProblem = async(req,res)=>{
   try{
    const userId= req.result._id;
    const problemId=req.params.pid;
    

    const ans= await Submission.find({userId,problemId});

    if(ans.length==0)
    res.send(200).send("No submission is present");

    res.status(200).send(ans);
   }
   catch(err){
res.status(500).send("Internal Server Error");
   }
}




module.exports={createProblem,updateProblem,deleteProblem, getAllProblem};