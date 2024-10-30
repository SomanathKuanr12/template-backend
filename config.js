
const db=require('mysql')
const con=db.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'daynamic_template_generator'
})
con.connect((err,res)=>{
    if(err)
    console.log(err);
console.log("connected");
})

module.exports=con