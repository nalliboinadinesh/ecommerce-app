import mongoose from 'mongoose'

const connectionDB = async ()=>{
    mongoose.connection.on('connected',()=>{
        console.log('DB Connected')
    })
    await mongoose.connect(`${process.env.MONGO_URI}/ecommerce`)
}

export default connectionDB;