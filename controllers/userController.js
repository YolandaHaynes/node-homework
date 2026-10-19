global.users = [];

function register(req, res){
    const user = {
        name: req.body.name, 
        email: req.body.email, 
        password: req.body.password};

    global.users.push(user);
    global.user_id= user;

    res.status(201).json({
    'name': user.name,
    'email': user.email,
  });
}

function logon(req, res){
    const user = global.users.find((user) => {
    return user.email === req.body.email &&
           user.password === req.body.password;
        });

    if (user){
        global.user_id = user;
        res.status(200).json({
            'name': global.user_id.name,
            'email': global.user_id.email,
        });
    } else {
        res.status(401).json({
            message: "Invalid email or password",
        });
    }
}


function logoff(req, res){
    global.user_id = null;
    res.status(200).json({
        message: "You have logged off successfully",
    })
    
}

module.exports ={
    register, 
    logon,
    logoff
};