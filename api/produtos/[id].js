import { sql } from "../../lib/db.js";
import jwt from "jsonwebtoken";


export default async function handler(req,res){


const auth=req.headers.authorization;


if(!auth){

return res.status(401).json({
erro:"Não autorizado"
});

}


try{


jwt.verify(
auth.split(" ")[1],
process.env.JWT_SECRET
);



if(req.method==="DELETE"){


const {id}=req.query;


await sql`

DELETE FROM products
WHERE id=${id}

`;


return res.json({
ok:true
});


}



return res.status(405).json({
erro:"Método inválido"
});



}catch(erro){


console.log(erro);


return res.status(401).json({
erro:"Token inválido"
});


}


}