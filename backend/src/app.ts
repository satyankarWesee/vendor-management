import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { ErrorHandler } from './utils';
import { adminRouter } from './router';
import { connectToDatabase } from './database';
import cors from 'cors';

import * as dotEnv from 'dotenv';
import { PORT, DB_URI } from './config'; 

import { EmployeeDocument } from './constants';
import { Employee } from './database/models/Employee'; 
// Load environment variables from .env file
if (process.env.NODE_ENV !== 'prod') {
  const configFile = `./.env.${process.env.NODE_ENV}`;
  dotEnv.config({ path: configFile });
} else {
  dotEnv.config();
}

const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const uri = DB_URI; // Use DB_URI from your config
//mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(uri);


app.use(bodyParser.json());

// rate limit
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests
  })
);

// allow cors all *
app.use(cors({ origin: '*' }));

// Logging and parsing
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Server is running.');
})

// for AWS EB health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('ok');
});

// API router
app.use('/admin', adminRouter);

// Error handling
app.use(ErrorHandler);

// Employee upload route
app.post('/admin/employees/upload', async (req: Request, res: Response) => {
  try {
      const employees: EmployeeDocument[] = req.body; // Specify the type here
      console.log(employees);
      // Fetch unique specializations from the database
      const specializations = await Employee.distinct('specialization');
      console.log(specializations);
      // Perform manipulation and comparison with the fetched specializations
      const updatedEmployees = employees.map((employee) => {
          const normalizedSpecialization = normalizeSpecialization(employee.specialization);
          const existingSpecialization = specializations.find(specialization => 
              normalizeSpecialization(specialization) === normalizedSpecialization
          );

          // Replace the specialization with the existing one if found  
          if (existingSpecialization) {
              employee.specialization = existingSpecialization;
              console.log("yes exist");
          }
          console.log("Normalized: ",normalizedSpecialization);
          console.log("Existing: ",existingSpecialization);
          return employee;
      });

      // Insert the updated employees into the database
      const result = await Employee.insertMany(updatedEmployees);
      res.status(201).json({ message: 'Employees added successfully', data: result });

  } catch (error) {
      console.error('InsertMany Error:', error);
      res.status(500).json({ message: 'Error adding employees' });
  }
});

// Normalization function to standardize specializations
function normalizeSpecialization(specialization: string): string {
    return specialization
        .toLowerCase()                      // Convert to lowercase
        .replace(/[^a-zA-Z0-9]/g, '')       
        .trim();                            // Trim leading and trailing whitespace


}

// Define a new route to get unique departments
app.get('/admin/employees/departments', async (req: Request, res: Response) => {
  try {
    const uniqueDepartments = await Employee.distinct("department");
    res.status(200).json(uniqueDepartments);
  } catch (error) {
    console.error("Error fetching unique departments:", error);
    res.status(500).json({ message: "Error fetching departments" });
  }
});

// Unque Specializations
app.get('/admin/employees/specializations', async (req: Request, res: Response) => {
  try {
    const uniqueSpecializations = await Employee.distinct("specialization");
    res.status(200).json(uniqueSpecializations);
  } catch (error) {
    console.error("Error fetching unique specializations:", error);
    res.status(500).json({ message: "Error fetching specializations" });
  }
}); 

// Department wise Specializations
app.get('/admin/employees/specializations/:department', async (req: Request, res: Response) => {
  const { department } = req.params;
  try {
    const specializations = await Employee.distinct("specialization", { department });
    res.status(200).json(specializations);
  } catch (error) {
    console.error("Error fetching specializations by department:", error);
    res.status(500).json({ message: "Error fetching specializations" });
  }
});

export default app;
