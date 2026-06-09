const validator=require('validator');

const validate= (data)=>{
    const mandatoryField=['firstName','lastName','emailId','password'];

    const isAllowed=mandatoryField.every((k)=>Object.keys(data).includes(k));
    if(!isAllowed)
    throw new Error("Some Field is Missing");

    if(!validator.isEmail(data.emailId))
    throw new Error("invalid Email");

    if(!validator.isStrongPassword(data.password))
    throw new Error("Weak password");

}


module.exports=validate;