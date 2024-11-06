import { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import * as XLSX from "xlsx";

export default function EmployeeRegistration() {
  const { logout, token } = useContext(AuthContext);
  const apiUrl = "http://localhost:3000"; // or import.meta.env.VITE_API_URL;

  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    profile: "",
    department: "",
    specialization: "",
  });

  // State for unique departments and specializations
  const [departments, setDepartments] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [manualEntry, setManualEntry] = useState({ department: false, specialization: false });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSpecialization, setSearchSpecialization] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchSpecializationRef = useRef<HTMLInputElement | null>(null);

  // Fetch unique departments and specializations on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/employees/departments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDepartments(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to fetch departments");
      }
    };

    const fetchSpecializations = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/employees/specializations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSpecializations(response.data);
      } catch (error) {
        console.error("Error fetching specializations:", error);
        toast.error("Failed to fetch specializations");
      }
    };

    fetchDepartments();
    fetchSpecializations();
  }, [apiUrl, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmployee({
      ...employee,
      [e.target.name]: e.target.value,
    });
  };

  const handleValueChange = (field: string, value: string) => {
    setEmployee({
      ...employee,
      [field]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = JSON.stringify(employee);

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${apiUrl}/admin/employee`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: data,
    };

    try {
      await axios.request(config);
      toast.success("Employee registered successfully");
      navigate("/admin");
    } catch (error: any) {
      handleErrorResponse(error);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please upload a file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) {
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        try {
          const config = {
            method: "post",
            maxBodyLength: Infinity,
            url: `${apiUrl}/admin/employees/upload`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            data: jsonData,
          };

          await axios.request(config);
          toast.success("Employees registered successfully");
          navigate("/admin");
        } catch (error: any) {
          handleErrorResponse(error);
        }
      } else {
        toast.error("Error reading file data");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleErrorResponse = (error: any) => {
    if (error.response?.status === 401) {
      toast.error("You are not authorized to perform this action");
      logout();
      navigate("/login");
    } else {
      toast.error("Failed to register employee");
    }
    console.log(error);
  };

  return (
    <div className="registration-form-wrapper">
      <div className="registration-form-container">
        <h1 className="text-2xl font-bold text-center mb-6">Register Employee</h1>
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={employee.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Contact</Label>
            <Input
              id="email"
              name="email"
              type="text"
              value={employee.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="profile">Website</Label>
            <Input
              id="profile"
              name="profile"
              type="url"
              value={employee.profile}
              onChange={handleChange}
              required
            />
          </div>

          {/* Department Dropdown */}
          <div>
            <Label htmlFor="department">Category</Label>
            <div className="flex items-center space-x-2">
              {!manualEntry.department ? (
                <>
                  <Select
                    name="department"
                    value={employee.department}
                    onValueChange={(value) => handleValueChange("department", value)}
                    required
                  >
                    <SelectTrigger id="department" className="flex-grow">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          type="text"
                          placeholder="Search Department"
                          value={searchTerm}
                          ref={searchInputRef}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                          onFocus={() => searchInputRef.current?.focus()}
                        />
                        {departments
                          .filter((dept) => dept.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => setManualEntry({ ...manualEntry, department: true })}
                    className="px-3 py-1 text-sm"
                  >
                    Enter Manually
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="Enter Department"
                    value={employee.department}
                    onChange={handleChange}
                    required
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    onClick={() => setManualEntry({ ...manualEntry, department: false })}
                    className="px-3 py-1 text-sm"
                  >
                    Select from List
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Specialization Dropdown */}
          <div>
            <Label htmlFor="specialization">Specialization/Area of Expertise</Label>
            <div className="flex items-center space-x-2">
              {!manualEntry.specialization ? (
                <>
                  <Select
                    name="specialization"
                    value={employee.specialization}
                    onValueChange={(value) => handleValueChange("specialization", value)}
                    required
                  >
                    <SelectTrigger id="specialization" className="flex-grow">
                      <SelectValue placeholder="Select Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          type="text"
                          placeholder="Search Specialization"
                          value={searchSpecialization}
                          ref={searchSpecializationRef}
                          onChange={(e) => setSearchSpecialization(e.target.value)}
                          className="mb-2"
                          onFocus={() => searchSpecializationRef.current?.focus()}
                        />
                        {specializations
                          .filter((spec) => spec.toLowerCase().includes(searchSpecialization.toLowerCase()))
                          .map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => setManualEntry({ ...manualEntry, specialization: true })}
                    className="px-3 py-1 text-sm"
                  >
                    Enter Manually
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="specialization"
                    name="specialization"
                    type="text"
                    placeholder="Enter Specialization"
                    value={employee.specialization}
                    onChange={handleChange}
                    required
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    onClick={() => setManualEntry({ ...manualEntry, specialization: false })}
                    className="px-3 py-1 text-sm"
                  >
                    Select from List
                  </Button>
                </>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Register Employee
          </Button>
        </form>

        <div className="file-upload-section">
          <h2 className="text-xl font-semibold mt-8">Upload Employee Data</h2>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="mt-4"
          />
          <Button onClick={handleUpload} className="mt-2">
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
