import { useForm } from 'react-hook-form';

function Signup(){
       const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

    return(
        <>
        <form onSubmit={handleSubmit((data) => console.log(data))}>
         <input {...register('firstName')} 
         placeholder='Enter Name' />

          <input {...register('email')} 
          placeholder='Enter Email'/>

          <input {...register('password')} 
          placeholder='Enter Password'/> 

          <button type="submit" className='btn btn-lg'>Submit</button>       
          
        </form>
        </>

    )
}

export default Signup;



// import { useState } from "react";


// function Signup(){

//     const [name,setName]=useState('');
//     const [email,setEmail]=useState('');
//     const [password,setPassword]=useState('');
//     const [reEnterPassword,reEnterPassword]=useState('');


//     function handleSubmit(e){

//       e.preventDefault();


//       console.log(name,email,password);

//        //validation


//     }

//     return(
//         <form onSubmit={handleSubmit} className=" min-h-screen flex flex-col justify-center items-center gap-y-2">
//           <input type="text" value={name} placeholder="Enter yout FirstName" onChange={(e)=>setName(e.target.value)}></input>
//           <input type="email" value={email} placeholder="Enter yout Email" onChange={(e)=>setEmail(e.target.value)}></input>
//           <input type="password" value={password} placeholder="Enter yout Password" onChange={(e)=>setPassword(e.target.value)}></input>
//           <button type="submit">Submit</button>
//         </form>
//     )
// }