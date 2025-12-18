import app from "./app";
import dotenv from "dotenv"; 

dotenv.config();

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try { 
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        }); 
    } catch (error) {
        console.error(`[Error][Server]: ${error}`);
        process.exit(1)
    }
}

startServer();