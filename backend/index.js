const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path'); // To get access to backend directory
const cors = require('cors');




app.use(express.json());
app.use(cors()); // Using this our reactjs project will connect to express app on 4000 port

// Initializing Database 

// Database Connection with MongoDb

mongoose.connect("mongodb+srv://arhambutt:arham527@cluster0.c0ldt.mongodb.net/e-commerce")

// API Creation

app.get("/", (req, res) => {
    res.send("Express App is Running")
})

// Image Storing Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})


const upload = multer({
    storage: storage
});

// Initialize upload middleware and add file size limit
  


app.use('/images',express.static('./upload/images'));

// Creating Upload Endpoint for Image

app.post("/upload", upload.single('product'), (req, res) => {  
  
    res.json({
      success: 1,
      image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

  

// Schema for creating products

const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    new_price: {
        type: Number,
        required: true
    },
    old_price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    available: {
        type: Boolean,
        default: true
    }
})

// API for adding product
app.post("/addproduct", async (req, res) => {
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else{
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price
    });
    
    console.log("Product Added");
    
    await product.save();
    
    res.json({
        success: true,
        name: req.body.name
    })
});// End of add product

// API for deleting product

app.post("/removeproduct", async (req, res) => {
    await Product.findOneAndDelete({id: req.body.id});
    console.log("Product Deleted");
    
    res.json({
        success: true,
        name: req.body.name
    })
})

// API for getting all products

app.get("/allproducts", async (req, res) => {
    let products = await Product.find({});
    console.log("Products Fetched");
    
    res.send(products);
})

// Schema for creating users

const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

// API for adding user

app.post('/signup', async (req, res) => {

    // Check if user already exists
    let check = await Users.findOne({email: req.body.email});
    if(check){
        return res.status(400).json({
            success: false,
            message: "User with this email already exists!"
        })
    }

    // Creating empty cart
    let cart = {};
    for (let i = 0; i<300;i++){
        cart[i] = 0;
    }

    // Creating user
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });



    // Saving user
    await user.save();
    console.log("User Added");
    
    
    // JWT authentication
    const data={    
        user:{
            id: user.id
        }
    }

    const token = jwt.sign(data, 'secret_ecom');


    res.json({
        success: true,
        token
    })
})// End of signup API


// API for login user

app.post('/login', async (req, res) => {
    let user = await Users.findOne({email: req.body.email});
    if(user){
        if(req.body.password === user.password){
            const data={
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({
                success: true,
                token
            })
        }
        else{
            res.json({
                success: false,
                message: "Invalid Password",
            })
        }
    }
    else{
        res.json({
            success: false,
            message: "Invalid Email",
        })
    }
})


// API for newcollection data

app.get('/newcollection', async (req, res) => {
    let products = await Product.find({});
    // Getting recently added 8 products
    let newcollection = products.slice(1).slice(-8);
    
    res.send(newcollection);
})

// API for popular in women data

app.get('/popularinwomen', async(req,res) => {
    let products = await Product.find({category:"woman"});
    let popular = products.slice(0,4); 
    res.send(popular);
})


// Middleware to fetch user

const fetchUser = async(req, res, next) => {
    const token = req.header('token');
    if(!token){
        res.status(401).send({
            message: "Invalid Token",
        })
    }
    else{
        try{
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        }catch(err){
            res.status(401).send({
                message: "Invalid Token",
            })
        }
    }
}

// API to add products in cartdata

app.post('/addtocart', fetchUser, async (req,res)=>{
    // Getting user
    let userData = await Users.findOne({
        _id: req.user.id
    })

    // Updating User cartdata
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send("Product added to cart");
})

// API to remove products from cartdata

app.post('/removefromcart', fetchUser, async (req,res)=>{
    let userData = await Users.findOne({
        _id: req.user.id
    })
    if(userData.cartData[req.body.itemId]>0){
        userData.cartData[req.body.itemId] -= 1;
        await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    }
    // Updating User cartdata
    
    res.send("Product removed from cart");
})

// API to get cart data

app.post('/getcart', fetchUser, async (req,res)=>{
    let userData = await Users.findOne({
        _id: req.user.id
    });
    res.json(userData.cartData);
})


app.listen(port, (error) => {
    if(!error){
        console.log(`Server is running on port ${port}`);
    }
    else{
        console.log("Error : "+error);
    }
})