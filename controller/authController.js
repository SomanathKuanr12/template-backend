const con=require('../config')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

function userSignUp(req, resp) {
    console.log("called");
    
    
    
    const { email, password } = req.body;
    
    //console.log(email);
    
    bcrypt.hash(password, 6, (err, hash) => {
        if (err) {
            // Send the error as a JSON response with a 500 status code
            return resp.status(500).json({ message: "Hashing error", error: err.message });
        } else {
            con.query("INSERT INTO user_registration (email, password) VALUES (?,?)", [email, hash], (err, res) => {
                if (err) {
                    return resp.status(405).json({ message: "error in db", error: err.message });
                } else {
                    resp.status(201).json({ message: "User registered successfully", result: res });
                }
            });
        }
    });
}




function userLogIn(req, resp){
    const email = req.body.email
    const password = req.body.password
    
    
    //console.log(req.body);
    //const { email, password } = req.body
    con.query("select * from user_registration where email=?", [email], (err, res) => {
        if (err) {
            resp.send(err)
        }
        else {
            if (res.length < 1)  //if the result array is empty
            {
                resp.status(405).json({ message: 'Unregistered user' });
                return;
            }
            else {

                bcrypt.compare(password, res[0].password, (err, result) => {
                    if (!result) //if password does not match
                    {
                        resp.status(401).json({ message: 'Password does not match' });
                        return;
                    }
                    if (result) //if password match
                    {
                        const token = jwt.sign({  //payload
                            email: res[0].email,
                            code: 'admin',

                        },
                        'this is jwt',  // Secret key
                        { expiresIn: "1h" }  //optional expire time
                        );
                        //console.log(token);
                        resp.status(200).json({ message: `user login successfully`, token: token, email: email,userid:res[0].userid });
                    }
                })
            }
        }
    })
}

function changePassword(req, resp){
    const { oldPassword, newPassword, email } = req.body
    //console.log(email)
    if(newPassword=='')
    {
        resp.status(406).json({ message: 'new password field is empty' });
        return;
    }
    if (oldPassword == newPassword)  //if new password and old password are same
    {
        resp.status(405).json({ message: 'old password and new password are same' });
        return;
    }
    con.query("select * from registration2 where email=?", [email], (err, res) => {
        if (err) {
        resp.status(403).json({message:'error in db'})
        }
        else {
            if (res.length < 1)  //if the result array is empty
            {
                resp.status(403).json({ message: 'email id does not exist' });
                return;
            }
            else {
                const hash=bcrypt.hashSync(newPassword,6);
                bcrypt.compare(oldPassword, res[0].password, (err, result) => {
                    if (!result) //if password does not match
                    {
                        resp.status(401).json({ message: 'old Password does not match' });
                        return;
                    }
                    if (result) //if password match  
                    {
                    con.query("UPDATE registration2 SET password=?  where email=?", [hash, email], (err, res) => {
                    if (err) {
                        resp.status(407).json({ message: 'error in DB' });
                        return;
                    }
                    if (res) {
                        resp.status(200).json({ message: 'Password updated successfully' });
                    }
                })
            }
      })
   }
}

})
}


module.exports={
    userSignUp,
    userLogIn,
    
    changePassword
}