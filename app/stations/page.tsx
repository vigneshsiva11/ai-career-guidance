"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Clock,
  Phone,
  Users,
  BookOpen,
  Search,
  Navigation,
  ArrowLeft,
  CheckCircle,
  Brain,
  Loader2,
  Calendar,
  Plus,
  X,
} from "lucide-react"
import Link from "next/link"
import type { LearningStation } from "@/lib/types"

export default function LearningStationsPage() {
  const [stations, setStations] = useState<LearningStation[]>([])
  const [filteredStations, setFilteredStations] = useState<LearningStation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [aiResponse, setAiResponse] = useState<string>("")
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showAIResponse, setShowAIResponse] = useState(false)
  const [showClassRequest, setShowClassRequest] = useState(false)
  const [showStationApplication, setShowStationApplication] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [stationApplication, setStationApplication] = useState({
    // Applicant Information
    fullName: "",
    email: "",
    phone: "",
    organization: "",
    
    // Station Setup
    location: "",
    spaceCapacity: "",
    availableDevices: {
      computer: false,
      tablet: false,
      internet: false,
      other: false
    },
    operatingHours: "",
    
    // Staffing
    hasStaff: false,
    staffCount: 0,
    
    // Agreement
    canOperate4Hours: false,
    agreeToGuidelines: false
  })

  useEffect(() => {
    fetchLearningStations()
    getUserLocation()
  }, [])

  useEffect(() => {
    filterStationsAndSearchTopics()
  }, [stations, searchQuery])

  const fetchLearningStations = async () => {
    try {
      const mockStations: LearningStation[] = [
        // Trichy District - 5 Stations
        {
          id: 1,
          name: "Bharathidasan University Learning Hub",
          location: "Bharathidasan University, Trichy, Tamil Nadu",
          contact_person: "Dr. Meera Devi",
          contact_phone: "+91-9876543211",
          operating_hours: "10:00 AM - 7:00 PM",
          available_subjects: ["Mathematics", "Computer Science", "Physics", "Chemistry"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "NIT Trichy Learning Center",
          location: "NIT Campus, Trichy, Tamil Nadu",
          contact_person: "Dr. Anitha",
          contact_phone: "+91-9876543240",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Technology", "Mathematics", "Science"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: "Srirangam Community Learning Center",
          location: "Srirangam, Trichy, Tamil Nadu",
          contact_person: "Lakshmi Priya",
          contact_phone: "+91-9876543212",
          operating_hours: "8:00 AM - 5:00 PM",
          available_subjects: ["Tamil", "English", "Social Studies", "Mathematics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 4,
          name: "Trichy Central Library Hub",
          location: "Central Library, Trichy, Tamil Nadu",
          contact_person: "Murugan",
          contact_phone: "+91-9876543241",
          operating_hours: "8:00 AM - 6:00 PM",
          available_subjects: ["General Knowledge", "History", "Tamil", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 5,
          name: "Trichy Fort Learning Station",
          location: "Rock Fort, Trichy, Tamil Nadu",
          contact_person: "Heritage Guide Rajesh",
          contact_phone: "+91-9876543242",
          operating_hours: "6:00 AM - 6:00 PM",
          available_subjects: ["History", "Architecture", "Tamil", "Culture"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 6,
          name: "Trichy Medical College Learning Hub",
          location: "Trichy Medical College, Trichy, Tamil Nadu",
          contact_person: "Dr. Lakshmi Devi",
          contact_phone: "+91-9876543243",
          operating_hours: "8:00 AM - 6:00 PM",
          available_subjects: ["Medical Science", "Biology", "Chemistry", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 7,
          name: "Trichy Engineering College Center",
          location: "Trichy Engineering College, Trichy, Tamil Nadu",
          contact_person: "Dr. Senthil Kumar",
          contact_phone: "+91-9876543244",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Mathematics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 8,
          name: "Trichy Arts College Learning Station",
          location: "Trichy Arts College, Trichy, Tamil Nadu",
          contact_person: "Prof. Geetha",
          contact_phone: "+91-9876543245",
          operating_hours: "8:00 AM - 5:00 PM",
          available_subjects: ["Tamil Literature", "English Literature", "History", "Fine Arts"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Chennai District - 5 Stations
        {
          id: 9,
          name: "Anna University Learning Center",
          location: "Guindy, Chennai, Tamil Nadu",
          contact_person: "Dr. Rajesh Sharma",
          contact_phone: "+91-9876543215",
          operating_hours: "9:00 AM - 8:00 PM",
          available_subjects: ["Mathematics", "Computer Science", "Engineering", "Physics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 10,
          name: "T. Nagar Community Learning Hub",
          location: "T. Nagar, Chennai, Tamil Nadu",
          contact_person: "Priya Venkatesh",
          contact_phone: "+91-9876543216",
          operating_hours: "8:00 AM - 7:00 PM",
          available_subjects: ["English", "Tamil", "Mathematics", "Computer Science"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 11,
          name: "Velachery Tech Learning Center",
          location: "Velachery, Chennai, Tamil Nadu",
          contact_person: "Arun Prakash",
          contact_phone: "+91-9876543217",
          operating_hours: "10:00 AM - 9:00 PM",
          available_subjects: ["Computer Science", "Programming", "English", "Mathematics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 12,
          name: "Adyar Library Learning Station",
          location: "Adyar, Chennai, Tamil Nadu",
          contact_person: "Sunitha Raj",
          contact_phone: "+91-9876543218",
          operating_hours: "9:00 AM - 6:00 PM",
          available_subjects: ["English", "Literature", "History", "Geography"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 13,
          name: "Mylapore Cultural Center",
          location: "Mylapore, Chennai, Tamil Nadu",
          contact_person: "Geetha Krishnan",
          contact_phone: "+91-9876543219",
          operating_hours: "7:00 AM - 6:00 PM",
          available_subjects: ["Tamil", "Sanskrit", "Music", "Arts"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Coimbatore District - 5 Stations
        {
          id: 14,
          name: "PSG College Learning Center",
          location: "Peelamedu, Coimbatore, Tamil Nadu",
          contact_person: "Dr. Karthik Raj",
          contact_phone: "+91-9876543220",
          operating_hours: "9:00 AM - 6:00 PM",
          available_subjects: ["Engineering", "Computer Science", "Mathematics", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 15,
          name: "Bharathiar University Center",
          location: "Bharathiar University, Coimbatore, Tamil Nadu",
          contact_person: "Dr. Kavitha",
          contact_phone: "+91-9876543242",
          operating_hours: "9:00 AM - 6:00 PM",
          available_subjects: ["Arts", "Science", "Commerce", "Tamil"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 16,
          name: "Gandhipuram Learning Hub",
          location: "Gandhipuram, Coimbatore, Tamil Nadu",
          contact_person: "Selvam",
          contact_phone: "+91-9876543243",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Business", "English", "Computer Science", "Mathematics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 17,
          name: "RS Puram Community Center",
          location: "RS Puram, Coimbatore, Tamil Nadu",
          contact_person: "Radha",
          contact_phone: "+91-9876543244",
          operating_hours: "7:00 AM - 7:00 PM",
          available_subjects: ["Tamil", "English", "Social Studies", "Arts"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 18,
          name: "Coimbatore Institute of Technology Hub",
          location: "Civil Aerodrome Post, Coimbatore, Tamil Nadu",
          contact_person: "Priya Lakshmi",
          contact_phone: "+91-9876543221",
          operating_hours: "8:00 AM - 7:00 PM",
          available_subjects: ["Technology", "Science", "Mathematics", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Madurai District - 5 Stations
        {
          id: 19,
          name: "Madurai Kamaraj University Center",
          location: "Madurai Kamaraj University, Madurai, Tamil Nadu",
          contact_person: "Dr. Senthil Kumar",
          contact_phone: "+91-9876543222",
          operating_hours: "9:00 AM - 6:00 PM",
          available_subjects: ["Arts", "Science", "Commerce", "Tamil"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 20,
          name: "Thirumalai Nayak Palace Learning Hub",
          location: "Palace Area, Madurai, Tamil Nadu",
          contact_person: "Meenakshi Devi",
          contact_phone: "+91-9876543223",
          operating_hours: "10:00 AM - 5:00 PM",
          available_subjects: ["History", "Culture", "Tamil Literature", "Arts"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 21,
          name: "Meenakshi Temple Learning Center",
          location: "Temple Area, Madurai, Tamil Nadu",
          contact_person: "Ramanathan",
          contact_phone: "+91-9876543245",
          operating_hours: "6:00 AM - 6:00 PM",
          available_subjects: ["Religious Studies", "Tamil", "History", "Culture"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 22,
          name: "Anna Bus Stand Learning Hub",
          location: "Anna Bus Stand, Madurai, Tamil Nadu",
          contact_person: "Kavitha",
          contact_phone: "+91-9876543246",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["English", "Tamil", "Mathematics", "General Knowledge"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 23,
          name: "Thiagarajar College Center",
          location: "Thiagarajar College, Madurai, Tamil Nadu",
          contact_person: "Dr. Murugan",
          contact_phone: "+91-9876543247",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Science", "Mathematics", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Mumbai District - 5 Stations
        {
          id: 24,
          name: "IIT Bombay Learning Hub",
          location: "Powai, Mumbai, Maharashtra",
          contact_person: "Dr. Priya Desai",
          contact_phone: "+91-9876543400",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Mathematics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 25,
          name: "Gateway of India Learning Center",
          location: "Gateway of India, Mumbai, Maharashtra",
          contact_person: "Heritage Guide Patel",
          contact_phone: "+91-9876543401",
          operating_hours: "24/7",
          available_subjects: ["History", "Architecture", "Marathi", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 26,
          name: "Juhu Beach Learning Hub",
          location: "Juhu Beach, Mumbai, Maharashtra",
          contact_person: "Marine Guide Sharma",
          contact_phone: "+91-9876543402",
          operating_hours: "6:00 AM - 8:00 PM",
          available_subjects: ["Marine Biology", "Environmental Science", "English", "Marathi"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 27,
          name: "Bandra Kurla Complex Learning Center",
          location: "BKC, Mumbai, Maharashtra",
          contact_person: "Business Expert Mehta",
          contact_phone: "+91-9876543403",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Business", "Finance", "English", "Economics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 28,
          name: "Elephanta Caves Learning Hub",
          location: "Elephanta Island, Mumbai, Maharashtra",
          contact_person: "Archaeologist Joshi",
          contact_phone: "+91-9876543404",
          operating_hours: "9:00 AM - 5:00 PM",
          available_subjects: ["Archaeology", "History", "Sanskrit", "Art"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Bangalore District - 5 Stations
        {
          id: 29,
          name: "IISc Bangalore Learning Hub",
          location: "Cubbon Park, Bangalore, Karnataka",
          contact_person: "Dr. Anitha Rao",
          contact_phone: "+91-9876543405",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Science", "Research", "Technology", "Mathematics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 30,
          name: "Lalbagh Botanical Learning Center",
          location: "Lalbagh, Bangalore, Karnataka",
          contact_person: "Botanist Reddy",
          contact_phone: "+91-9876543406",
          operating_hours: "6:00 AM - 6:00 PM",
          available_subjects: ["Botany", "Environmental Science", "Kannada", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 31,
          name: "Electronic City Tech Hub",
          location: "Electronic City, Bangalore, Karnataka",
          contact_person: "Tech Expert Kumar",
          contact_phone: "+91-9876543407",
          operating_hours: "9:00 AM - 8:00 PM",
          available_subjects: ["Computer Science", "AI/ML", "Programming", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 32,
          name: "Bangalore Palace Learning Center",
          location: "Bangalore Palace, Bangalore, Karnataka",
          contact_person: "Heritage Guide Lakshmi",
          contact_phone: "+91-9876543408",
          operating_hours: "10:00 AM - 5:00 PM",
          available_subjects: ["History", "Architecture", "Kannada", "Culture"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 33,
          name: "MG Road Business Learning Hub",
          location: "MG Road, Bangalore, Karnataka",
          contact_person: "Business Consultant Rao",
          contact_phone: "+91-9876543409",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Business", "Management", "English", "Economics"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Delhi District - 2 Stations
        {
          id: 34,
          name: "IIT Delhi Learning Hub",
          location: "Hauz Khas, New Delhi",
          contact_person: "Dr. Amit Kumar",
          contact_phone: "+91-9876543410",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 35,
          name: "Red Fort Heritage Learning Center",
          location: "Red Fort, Old Delhi",
          contact_person: "Heritage Guide Zainab",
          contact_phone: "+91-9876543411",
          operating_hours: "9:00 AM - 5:00 PM",
          available_subjects: ["History", "Architecture", "Urdu", "Hindi"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Hyderabad District - 2 Stations
        {
          id: 36,
          name: "IIIT Hyderabad Learning Center",
          location: "Gachibowli, Hyderabad, Telangana",
          contact_person: "Dr. Suresh Kumar",
          contact_phone: "+91-9876543412",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Computer Science", "AI/ML", "Technology", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 37,
          name: "Charminar Heritage Learning Hub",
          location: "Charminar, Hyderabad, Telangana",
          contact_person: "Cultural Guide Fatima",
          contact_phone: "+91-9876543413",
          operating_hours: "9:00 AM - 6:00 PM",
          available_subjects: ["History", "Islamic Studies", "Urdu", "Telugu"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Kolkata District - 2 Stations
        {
          id: 38,
          name: "IIT Kharagpur Learning Center",
          location: "Kharagpur, West Bengal",
          contact_person: "Dr. Soma Das",
          contact_phone: "+91-9876543414",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Bengali"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 39,
          name: "Victoria Memorial Learning Hub",
          location: "Victoria Memorial, Kolkata, West Bengal",
          contact_person: "Cultural Guide Rita",
          contact_phone: "+91-9876543415",
          operating_hours: "10:00 AM - 5:00 PM",
          available_subjects: ["History", "Art", "English", "Bengali"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Ahmedabad District - 2 Stations
        {
          id: 40,
          name: "IIT Gandhinagar Learning Center",
          location: "Gandhinagar, Gujarat",
          contact_person: "Dr. Patel",
          contact_phone: "+91-9876543416",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Gujarati"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 41,
          name: "Sabarmati Ashram Learning Hub",
          location: "Sabarmati Ashram, Ahmedabad, Gujarat",
          contact_person: "Gandhi Scholar Mehta",
          contact_phone: "+91-9876543417",
          operating_hours: "8:00 AM - 6:00 PM",
          available_subjects: ["History", "Philosophy", "Gujarati", "English"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Jaipur District - 2 Stations
        {
          id: 42,
          name: "IIT Jodhpur Learning Center",
          location: "Jodhpur, Rajasthan",
          contact_person: "Dr. Rajesh Singh",
          contact_phone: "+91-9876543418",
          operating_hours: "8:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Hindi"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 43,
          name: "Amber Fort Learning Hub",
          location: "Amber Fort, Jaipur, Rajasthan",
          contact_person: "Heritage Guide Priya",
          contact_phone: "+91-9876543419",
          operating_hours: "8:00 AM - 6:00 PM",
          available_subjects: ["History", "Architecture", "Hindi", "Rajasthani"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Lucknow District - 2 Stations
        {
          id: 44,
          name: "IIT Kanpur Learning Center",
          location: "Kanpur, Uttar Pradesh",
          contact_person: "Dr. Sharma",
          contact_phone: "+91-9876543420",
          operating_hours: "8:00 AM - 8:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Hindi"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 45,
          name: "Taj Mahal Learning Hub",
          location: "Taj Mahal, Agra, Uttar Pradesh",
          contact_person: "Heritage Guide Akbar",
          contact_phone: "+91-9876543421",
          operating_hours: "6:00 AM - 7:00 PM",
          available_subjects: ["Architecture", "History", "Art", "Urdu"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Chandigarh District - 2 Stations
        {
          id: 46,
          name: "IIT Ropar Learning Center",
          location: "Rupnagar, Punjab",
          contact_person: "Dr. Kaur",
          contact_phone: "+91-9876543422",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Punjabi"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 47,
          name: "Golden Temple Learning Hub",
          location: "Golden Temple, Amritsar, Punjab",
          contact_person: "Sikh Scholar Singh",
          contact_phone: "+91-9876543423",
          operating_hours: "24/7",
          available_subjects: ["Religious Studies", "History", "Punjabi", "Gurmukhi"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Kochi District - 2 Stations
        {
          id: 48,
          name: "IIT Palakkad Learning Center",
          location: "Palakkad, Kerala",
          contact_person: "Dr. Maya Menon",
          contact_phone: "+91-9876543424",
          operating_hours: "8:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Malayalam"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 49,
          name: "Kochi Backwaters Learning Hub",
          location: "Fort Kochi, Kochi, Kerala",
          contact_person: "Maritime Guide Thomas",
          contact_phone: "+91-9876543425",
          operating_hours: "8:00 AM - 6:00 PM",
          available_subjects: ["Maritime History", "Trade", "English", "Malayalam"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Tirupati District - 2 Stations
        {
          id: 50,
          name: "IIT Tirupati Learning Center",
          location: "Tirupati, Andhra Pradesh",
          contact_person: "Dr. Venkatesh Reddy",
          contact_phone: "+91-9876543426",
          operating_hours: "9:00 AM - 7:00 PM",
          available_subjects: ["Engineering", "Technology", "Science", "Telugu"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 51,
          name: "Vizag Port Learning Hub",
          location: "Visakhapatnam Port, Andhra Pradesh",
          contact_person: "Port Officer Raju",
          contact_phone: "+91-9876543427",
          operating_hours: "8:00 AM - 6:00 PM",
          available_subjects: ["Maritime Studies", "Trade", "English", "Telugu"],
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]

      setStations(mockStations)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching stations:", error)
      setIsLoading(false)
    }
  }

  const getUserLocation = () => {
    setUserLocation("Enter location")
  }

  const handleStationApplicationChange = (field: string, value: any) => {
    if (field === "availableDevices") {
      setStationApplication(prev => ({
        ...prev,
        availableDevices: {
          ...prev.availableDevices,
          [value]: !prev.availableDevices[value as keyof typeof prev.availableDevices]
        }
      }))
    } else {
      setStationApplication(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleStationApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log("Station application submitted:", stationApplication)
    setApplicationSubmitted(true)
    setShowStationApplication(false)
    
    // Reset form after submission
    setTimeout(() => {
      setApplicationSubmitted(false)
      setStationApplication({
        fullName: "",
        email: "",
        phone: "",
        organization: "",
        location: "",
        spaceCapacity: "",
        availableDevices: {
          computer: false,
          tablet: false,
          internet: false,
          
          other: false
        },
        operatingHours: "",
        hasStaff: false,
        staffCount: 0,
        canOperate4Hours: false,
        agreeToGuidelines: false
      })
    }, 5000)
  }

  const updateLocationFromSearch = (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase()
    
    // Tamil Nadu
    if (lowerQuery.includes("chennai")) {
      setUserLocation("Chennai, Tamil Nadu, India")
    } else if (lowerQuery.includes("coimbatore") || lowerQuery.includes("kovai")) {
      setUserLocation("Coimbatore, Tamil Nadu, India")
    } else if (lowerQuery.includes("madurai")) {
      setUserLocation("Madurai, Tamil Nadu, India")
    } else if (lowerQuery.includes("trichy") || lowerQuery.includes("tiruchirappalli")) {
      setUserLocation("Trichy, Tamil Nadu, India")
    } else if (lowerQuery.includes("salem")) {
      setUserLocation("Salem, Tamil Nadu, India")
    } else if (lowerQuery.includes("tiruppur")) {
      setUserLocation("Tiruppur, Tamil Nadu, India")
    } else if (lowerQuery.includes("vellore")) {
      setUserLocation("Vellore, Tamil Nadu, India")
    } else if (lowerQuery.includes("thanjavur")) {
      setUserLocation("Thanjavur, Tamil Nadu, India")
    } else if (lowerQuery.includes("tirunelveli")) {
      setUserLocation("Tirunelveli, Tamil Nadu, India")
    } else if (lowerQuery.includes("kanyakumari")) {
      setUserLocation("Kanyakumari, Tamil Nadu, India")
    } else if (lowerQuery.includes("cuddalore")) {
      setUserLocation("Cuddalore, Tamil Nadu, India")
    } else if (lowerQuery.includes("dharmapuri") || lowerQuery.includes("hogenakkal")) {
      setUserLocation("Dharmapuri, Tamil Nadu, India")
    }
    // Maharashtra
    else if (lowerQuery.includes("mumbai") || lowerQuery.includes("bombay")) {
      setUserLocation("Mumbai, Maharashtra, India")
    } else if (lowerQuery.includes("pune")) {
      setUserLocation("Pune, Maharashtra, India")
    } else if (lowerQuery.includes("nagpur")) {
      setUserLocation("Nagpur, Maharashtra, India")
    } else if (lowerQuery.includes("aurangabad")) {
      setUserLocation("Aurangabad, Maharashtra, India")
    }
    // Karnataka
    else if (lowerQuery.includes("bangalore") || lowerQuery.includes("bengaluru")) {
      setUserLocation("Bangalore, Karnataka, India")
    } else if (lowerQuery.includes("mysore") || lowerQuery.includes("mysuru")) {
      setUserLocation("Mysore, Karnataka, India")
    } else if (lowerQuery.includes("mangalore") || lowerQuery.includes("mangaluru")) {
      setUserLocation("Mangalore, Karnataka, India")
    } else if (lowerQuery.includes("hubli") || lowerQuery.includes("dharwad")) {
      setUserLocation("Hubli-Dharwad, Karnataka, India")
    }
    // Telangana
    else if (lowerQuery.includes("hyderabad")) {
      setUserLocation("Hyderabad, Telangana, India")
    } else if (lowerQuery.includes("warangal")) {
      setUserLocation("Warangal, Telangana, India")
    } else if (lowerQuery.includes("karimnagar")) {
      setUserLocation("Karimnagar, Telangana, India")
    }
    // Kerala
    else if (lowerQuery.includes("kochi") || lowerQuery.includes("cochin")) {
      setUserLocation("Kochi, Kerala, India")
    } else if (lowerQuery.includes("trivandrum") || lowerQuery.includes("thiruvananthapuram")) {
      setUserLocation("Thiruvananthapuram, Kerala, India")
    } else if (lowerQuery.includes("calicut") || lowerQuery.includes("kozhikode")) {
      setUserLocation("Kozhikode, Kerala, India")
    } else if (lowerQuery.includes("palakkad")) {
      setUserLocation("Palakkad, Kerala, India")
    }
    // Andhra Pradesh
    else if (lowerQuery.includes("vishakhapatnam") || lowerQuery.includes("vizag")) {
      setUserLocation("Visakhapatnam, Andhra Pradesh, India")
    } else if (lowerQuery.includes("tirupati")) {
      setUserLocation("Tirupati, Andhra Pradesh, India")
    } else if (lowerQuery.includes("vijayawada")) {
      setUserLocation("Vijayawada, Andhra Pradesh, India")
    } else if (lowerQuery.includes("guntur")) {
      setUserLocation("Guntur, Andhra Pradesh, India")
    }
    // Delhi
    else if (lowerQuery.includes("delhi") || lowerQuery.includes("new delhi")) {
      setUserLocation("New Delhi, Delhi, India")
    } else if (lowerQuery.includes("gurgaon") || lowerQuery.includes("gurugram")) {
      setUserLocation("Gurugram, Haryana, India")
    } else if (lowerQuery.includes("noida")) {
      setUserLocation("Noida, Uttar Pradesh, India")
    }
    // West Bengal
    else if (lowerQuery.includes("kolkata") || lowerQuery.includes("calcutta")) {
      setUserLocation("Kolkata, West Bengal, India")
    } else if (lowerQuery.includes("kharagpur")) {
      setUserLocation("Kharagpur, West Bengal, India")
    } else if (lowerQuery.includes("durgapur")) {
      setUserLocation("Durgapur, West Bengal, India")
    }
    // Gujarat
    else if (lowerQuery.includes("ahmedabad")) {
      setUserLocation("Ahmedabad, Gujarat, India")
    } else if (lowerQuery.includes("surat")) {
      setUserLocation("Surat, Gujarat, India")
    } else if (lowerQuery.includes("vadodara") || lowerQuery.includes("baroda")) {
      setUserLocation("Vadodara, Gujarat, India")
    } else if (lowerQuery.includes("gandhinagar")) {
      setUserLocation("Gandhinagar, Gujarat, India")
    }
    // Rajasthan
    else if (lowerQuery.includes("jaipur")) {
      setUserLocation("Jaipur, Rajasthan, India")
    } else if (lowerQuery.includes("jodhpur")) {
      setUserLocation("Jodhpur, Rajasthan, India")
    } else if (lowerQuery.includes("udaipur")) {
      setUserLocation("Udaipur, Rajasthan, India")
    } else if (lowerQuery.includes("ajmer")) {
      setUserLocation("Ajmer, Rajasthan, India")
    }
    // Uttar Pradesh
    else if (lowerQuery.includes("lucknow")) {
      setUserLocation("Lucknow, Uttar Pradesh, India")
    } else if (lowerQuery.includes("kanpur")) {
      setUserLocation("Kanpur, Uttar Pradesh, India")
    } else if (lowerQuery.includes("agra")) {
      setUserLocation("Agra, Uttar Pradesh, India")
    } else if (lowerQuery.includes("varanasi") || lowerQuery.includes("banaras")) {
      setUserLocation("Varanasi, Uttar Pradesh, India")
    }
    // Punjab
    else if (lowerQuery.includes("chandigarh")) {
      setUserLocation("Chandigarh, Punjab, India")
    } else if (lowerQuery.includes("amritsar")) {
      setUserLocation("Amritsar, Punjab, India")
    } else if (lowerQuery.includes("ludhiana")) {
      setUserLocation("Ludhiana, Punjab, India")
    } else if (lowerQuery.includes("jalandhar")) {
      setUserLocation("Jalandhar, Punjab, India")
    }
    // Other Major Cities
    else if (lowerQuery.includes("indore")) {
      setUserLocation("Indore, Madhya Pradesh, India")
    } else if (lowerQuery.includes("bhopal")) {
      setUserLocation("Bhopal, Madhya Pradesh, India")
    } else if (lowerQuery.includes("patna")) {
      setUserLocation("Patna, Bihar, India")
    } else if (lowerQuery.includes("ranchi")) {
      setUserLocation("Ranchi, Jharkhand, India")
    } else if (lowerQuery.includes("bhubaneswar")) {
      setUserLocation("Bhubaneswar, Odisha, India")
    } else if (lowerQuery.includes("guwahati")) {
      setUserLocation("Guwahati, Assam, India")
    } else if (lowerQuery.includes("imphal")) {
      setUserLocation("Imphal, Manipur, India")
    } else if (lowerQuery.includes("shillong")) {
      setUserLocation("Shillong, Meghalaya, India")
    } else if (lowerQuery.includes("aizawl")) {
      setUserLocation("Aizawl, Mizoram, India")
    } else if (lowerQuery.includes("kohima")) {
      setUserLocation("Kohima, Nagaland, India")
    } else if (lowerQuery.includes("itanagar")) {
      setUserLocation("Itanagar, Arunachal Pradesh, India")
    } else if (lowerQuery.includes("gangtok")) {
      setUserLocation("Gangtok, Sikkim, India")
    } else if (lowerQuery.includes("dehradun")) {
      setUserLocation("Dehradun, Uttarakhand, India")
    } else if (lowerQuery.includes("shimla")) {
      setUserLocation("Shimla, Himachal Pradesh, India")
    } else if (lowerQuery.includes("srinagar")) {
      setUserLocation("Srinagar, Jammu & Kashmir, India")
    } else if (lowerQuery.includes("leh")) {
      setUserLocation("Leh, Ladakh, India")
    } else if (lowerQuery.includes("panaji") || lowerQuery.includes("goa")) {
      setUserLocation("Panaji, Goa, India")
    } else if (lowerQuery.includes("port blair")) {
      setUserLocation("Port Blair, Andaman & Nicobar Islands, India")
    } else if (lowerQuery.includes("kavaratti")) {
      setUserLocation("Kavaratti, Lakshadweep, India")
    } else {
      // If it's not a recognized location, set to searched area with India
      setUserLocation(`${searchQuery}, India`)
    }
  }

  const filterStationsAndSearchTopics = async () => {
    let filtered = stations

    if (searchQuery) {
      // First, try to filter by location/station name
      filtered = filtered.filter(
        (station) =>
          station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.available_subjects.some((subject) => subject.toLowerCase().includes(searchQuery.toLowerCase())),
      )

      // Update location if search query matches a known location
      updateLocationFromSearch(searchQuery)

      // If no stations found and query looks like a topic (not a location), show class request
      if (filtered.length === 0 && searchQuery.length > 3) {
        if (isTopicSearch(searchQuery)) {
          setShowClassRequest(true)
          setShowAIResponse(false)
          setAiResponse("")
        } else {
          // If it might be a location, show no results message
          setShowClassRequest(false)
          setShowAIResponse(false)
          setAiResponse("")
        }
      } else {
        setShowClassRequest(false)
        setShowAIResponse(false)
        setAiResponse("")
      }
    } else {
      setShowClassRequest(false)
      setShowAIResponse(false)
      setAiResponse("")
      // Reset location when search is cleared
      setUserLocation("Enter location")
    }

    setFilteredStations(filtered)
  }

  // Function to detect if search query is a topic rather than a location
  const isTopicSearch = (query: string): boolean => {
    const topicKeywords = [
      'what is', 'how to', 'explain', 'define', 'solve', 'calculate', 'formula',
      'equation', 'theory', 'concept', 'process', 'method', 'steps', 'example',
      'photosynthesis', 'quadratic', 'algebra', 'geometry', 'chemistry', 'physics',
      'biology', 'history', 'geography', 'grammar', 'vocabulary', 'programming',
      'computer', 'science', 'math', 'english', 'hindi', 'social studies'
    ]
    
    const lowerQuery = query.toLowerCase()
    return topicKeywords.some(keyword => lowerQuery.includes(keyword))
  }

  const getAIAnswerForTopic = async (topic: string) => {
    setIsLoadingAI(true)
    setShowAIResponse(true)

    try {
      const response = await fetch("/api/ai/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: topic,
          subject: "General",
          grade: "Mixed",
          language: "English",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAiResponse(result.data.answer)
        } else {
          setAiResponse(
            "I'm having trouble answering that question right now. Please try again later or visit a learning station for help.",
          )
        }
      } else {
        setAiResponse(
          "I'm having trouble answering that question right now. Please try again later or visit a learning station for help.",
        )
      }
    } catch (error) {
      console.error("Error getting AI answer:", error)
      setAiResponse(
        "I'm having trouble answering that question right now. Please try again later or visit a learning station for help.",
      )
    } finally {
      setIsLoadingAI(false)
    }
  }

  const getStatusColor = (station: LearningStation) => {
    if (!station.is_active) return "destructive"
    return "default"
  }

  const getStatusText = (station: LearningStation) => {
    if (!station.is_active) return "Temporarily Closed"
    return "Open"
  }

  const loadMoreVenues = () => {
    const additionalStations: LearningStation[] = [
      // Chennai District - 5 Additional Stations
      {
        id: 26,
        name: "IIT Madras Learning Center",
        location: "IIT Madras Campus, Chennai, Tamil Nadu",
        contact_person: "Dr. Raghavan",
        contact_phone: "+91-9876543251",
        operating_hours: "9:00 AM - 8:00 PM",
        available_subjects: ["Engineering", "Research", "Technology", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 27,
        name: "Tambaram Learning Hub",
        location: "Tambaram, Chennai, Tamil Nadu",
        contact_person: "Shanti",
        contact_phone: "+91-9876543252",
        operating_hours: "8:00 AM - 7:00 PM",
        available_subjects: ["English", "Tamil", "Computer Science", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 28,
        name: "Chrompet Community Center",
        location: "Chrompet, Chennai, Tamil Nadu",
        contact_person: "Rajesh",
        contact_phone: "+91-9876543253",
        operating_hours: "7:00 AM - 6:00 PM",
        available_subjects: ["Business", "Accounting", "English", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 29,
        name: "Porur Tech Learning Center",
        location: "Porur, Chennai, Tamil Nadu",
        contact_person: "Kavitha Devi",
        contact_phone: "+91-9876543254",
        operating_hours: "9:00 AM - 8:00 PM",
        available_subjects: ["IT", "Software", "Programming", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 30,
        name: "Anna Nagar Learning Station",
        location: "Anna Nagar, Chennai, Tamil Nadu",
        contact_person: "Mohana",
        contact_phone: "+91-9876543255",
        operating_hours: "8:00 AM - 7:00 PM",
        available_subjects: ["General Knowledge", "Current Affairs", "English", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // Trichy District - 5 Additional Stations
      {
        id: 31,
        name: "Trichy BHEL Learning Center",
        location: "BHEL Township, Trichy, Tamil Nadu",
        contact_person: "Engineer Suresh",
        contact_phone: "+91-9876543256",
        operating_hours: "9:00 AM - 6:00 PM",
        available_subjects: ["Mechanical Engineering", "Electrical", "Mathematics", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 32,
        name: "Lalgudi Learning Hub",
        location: "Lalgudi, Trichy, Tamil Nadu",
        contact_person: "Ganga",
        contact_phone: "+91-9876543257",
        operating_hours: "8:00 AM - 5:00 PM",
        available_subjects: ["Agriculture", "Rural Development", "Tamil", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 33,
        name: "Musiri Community Center",
        location: "Musiri, Trichy, Tamil Nadu",
        contact_person: "Vellaiyan",
        contact_phone: "+91-9876543258",
        operating_hours: "8:00 AM - 6:00 PM",
        available_subjects: ["Social Studies", "History", "Tamil", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 34,
        name: "Manachanallur Learning Station",
        location: "Manachanallur, Trichy, Tamil Nadu",
        contact_person: "Devi",
        contact_phone: "+91-9876543259",
        operating_hours: "7:00 AM - 5:00 PM",
        available_subjects: ["Primary Education", "Basic Mathematics", "Tamil", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 35,
        name: "Thiruverumbur Tech Hub",
        location: "Thiruverumbur, Trichy, Tamil Nadu",
        contact_person: "Tech Guru Raman",
        contact_phone: "+91-9876543260",
        operating_hours: "9:00 AM - 7:00 PM",
        available_subjects: ["Computer Repair", "Technology", "Basic Programming", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // Coimbatore District - 5 Additional Stations
      {
        id: 36,
        name: "Kovai Medical Center Learning Hub",
        location: "Avinashi Road, Coimbatore, Tamil Nadu",
        contact_person: "Dr. Priya",
        contact_phone: "+91-9876543261",
        operating_hours: "8:00 AM - 6:00 PM",
        available_subjects: ["Medical Sciences", "Biology", "Chemistry", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 37,
        name: "Pollachi Learning Center",
        location: "Pollachi, Coimbatore, Tamil Nadu",
        contact_person: "Farmer Raja",
        contact_phone: "+91-9876543262",
        operating_hours: "7:00 AM - 6:00 PM",
        available_subjects: ["Agriculture", "Horticulture", "Tamil", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 38,
        name: "Singanallur Industrial Hub",
        location: "Singanallur, Coimbatore, Tamil Nadu",
        contact_person: "Industry Expert Kumar",
        contact_phone: "+91-9876543263",
        operating_hours: "8:00 AM - 8:00 PM",
        available_subjects: ["Industrial Training", "Mechanical", "Safety", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 39,
        name: "Saravanampatti IT Center",
        location: "Saravanampatti, Coimbatore, Tamil Nadu",
        contact_person: "Tech Lead Siva",
        contact_phone: "+91-9876543264",
        operating_hours: "9:00 AM - 9:00 PM",
        available_subjects: ["Software Development", "Data Science", "AI/ML", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 40,
        name: "Vadavalli Community Learning",
        location: "Vadavalli, Coimbatore, Tamil Nadu",
        contact_person: "Community Leader Meera",
        contact_phone: "+91-9876543265",
        operating_hours: "7:00 AM - 7:00 PM",
        available_subjects: ["Community Development", "Social Work", "Tamil", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // Madurai District - 5 Additional Stations
      {
        id: 41,
        name: "Pasumalai Hills Learning Center",
        location: "Pasumalai, Madurai, Tamil Nadu",
        contact_person: "Nature Guide Selvam",
        contact_phone: "+91-9876543266",
        operating_hours: "6:00 AM - 6:00 PM",
        available_subjects: ["Environmental Science", "Geography", "Tamil", "Biology"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 42,
        name: "Alagar Koil Learning Hub",
        location: "Alagar Koil, Madurai, Tamil Nadu",
        contact_person: "Priest Sundaram",
        contact_phone: "+91-9876543267",
        operating_hours: "5:00 AM - 7:00 PM",
        available_subjects: ["Religious Studies", "Sanskrit", "Tamil Literature", "Philosophy"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 43,
        name: "Usilampatti Learning Station",
        location: "Usilampatti, Madurai, Tamil Nadu",
        contact_person: "Rural Teacher Kamala",
        contact_phone: "+91-9876543268",
        operating_hours: "8:00 AM - 5:00 PM",
        available_subjects: ["Rural Education", "Agriculture", "Tamil", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 44,
        name: "Melur Community Center",
        location: "Melur, Madurai, Tamil Nadu",
        contact_person: "Social Worker Ravi",
        contact_phone: "+91-9876543269",
        operating_hours: "8:00 AM - 6:00 PM",
        available_subjects: ["Community Development", "Health Education", "Tamil", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 45,
        name: "Vadipatti Agricultural Center",
        location: "Vadipatti, Madurai, Tamil Nadu",
        contact_person: "Agricultural Expert Murugan",
        contact_phone: "+91-9876543270",
        operating_hours: "6:00 AM - 6:00 PM",
        available_subjects: ["Modern Agriculture", "Organic Farming", "Tamil", "Science"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // Erode District - 5 Additional Stations
      {
        id: 46,
        name: "Sathyamangalam Wildlife Center",
        location: "Sathyamangalam, Erode, Tamil Nadu",
        contact_person: "Forest Officer Devi",
        contact_phone: "+91-9876543271",
        operating_hours: "7:00 AM - 6:00 PM",
        available_subjects: ["Wildlife Conservation", "Environmental Science", "Biology", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 47,
        name: "Anthiyur Hills Learning Hub",
        location: "Anthiyur, Erode, Tamil Nadu",
        contact_person: "Hill Station Guide Raja",
        contact_phone: "+91-9876543272",
        operating_hours: "7:00 AM - 5:00 PM",
        available_subjects: ["Geography", "Tourism", "English", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 48,
        name: "Chennimalai Handloom Center",
        location: "Chennimalai, Erode, Tamil Nadu",
        contact_person: "Weaver Master Krishnan",
        contact_phone: "+91-9876543273",
        operating_hours: "8:00 AM - 7:00 PM",
        available_subjects: ["Handloom Technology", "Traditional Arts", "Business", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 49,
        name: "Perundurai Tech Park",
        location: "Perundurai Tech Park, Erode, Tamil Nadu",
        contact_person: "Tech Manager Lakshmi",
        contact_phone: "+91-9876543274",
        operating_hours: "9:00 AM - 8:00 PM",
        available_subjects: ["Information Technology", "Digital Marketing", "English", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 50,
        name: "Kodumudi Learning Station",
        location: "Kodumudi, Erode, Tamil Nadu",
        contact_person: "River Guide Selvam",
        contact_phone: "+91-9876543275",
        operating_hours: "8:00 AM - 6:00 PM",
        available_subjects: ["Water Resources", "Environmental Studies", "Tamil", "Geography"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      // Salem District - 10 Stations
      {
        id: 51,
        name: "Salem Government College Center",
        location: "Salem Government College, Salem, Tamil Nadu",
        contact_person: "Dr. Ramesh Kumar",
        contact_phone: "+91-9876543276",
        operating_hours: "9:00 AM - 6:00 PM",
        available_subjects: ["Science", "Mathematics", "English", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 52,
        name: "Salem Fort Learning Station",
        location: "Fort Area, Salem, Tamil Nadu",
        contact_person: "History Expert Lakshmi",
        contact_phone: "+91-9876543277",
        operating_hours: "8:00 AM - 5:00 PM",
        available_subjects: ["History", "Geography", "Social Studies", "Tamil"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 53,
        name: "Yercaud Hills Learning Center",
        location: "Yercaud Hills, Salem, Tamil Nadu",
        contact_person: "Hill Resort Manager Priya",
        contact_phone: "+91-9876543278",
        operating_hours: "7:00 AM - 6:00 PM",
        available_subjects: ["Ecology", "Tourism", "English", "Environmental Science"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 54,
        name: "Mettur Dam Learning Hub",
        location: "Mettur Dam, Salem, Tamil Nadu",
        contact_person: "Engineer Murugan",
        contact_phone: "+91-9876543279",
        operating_hours: "8:00 AM - 6:00 PM",
        available_subjects: ["Civil Engineering", "Water Management", "Mathematics", "Science"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 55,
        name: "Sankagiri Fort Center",
        location: "Sankagiri, Salem, Tamil Nadu",
        contact_person: "Fort Guide Raman",
        contact_phone: "+91-9876543280",
        operating_hours: "8:00 AM - 5:00 PM",
        available_subjects: ["Ancient History", "Architecture", "Tamil", "Culture"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 56,
        name: "Attur Industrial Learning",
        location: "Attur, Salem, Tamil Nadu",
        contact_person: "Industrial Trainer Kumar",
        contact_phone: "+91-9876543281",
        operating_hours: "8:00 AM - 7:00 PM",
        available_subjects: ["Industrial Safety", "Manufacturing", "English", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 57,
        name: "Namakkal Truck Hub Learning",
        location: "NH Salem, Namakkal, Tamil Nadu",
        contact_person: "Transport Expert Devi",
        contact_phone: "+91-9876543282",
        operating_hours: "24 Hours",
        available_subjects: ["Transport Management", "Logistics", "English", "Business"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 58,
        name: "Rasipuram Learning Station",
        location: "Rasipuram, Namakkal, Tamil Nadu",
        contact_person: "Agriculture Officer Selvam",
        contact_phone: "+91-9876543283",
        operating_hours: "7:00 AM - 6:00 PM",
        available_subjects: ["Agriculture", "Cooperative Management", "Tamil", "Mathematics"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 59,
        name: "Tiruchengode Temple Learning",
        location: "Tiruchengode, Namakkal, Tamil Nadu",
        contact_person: "Temple Scholar Sundaram",
        contact_phone: "+91-9876543284",
        operating_hours: "5:00 AM - 7:00 PM",
        available_subjects: ["Religious Studies", "Tamil Literature", "Sanskrit", "Philosophy"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 60,
        name: "Paramathi Velur Center",
        location: "Paramathi Velur, Namakkal, Tamil Nadu",
        contact_person: "Rural Development Officer Priya",
        contact_phone: "+91-9876543285",
        operating_hours: "8:00 AM - 6:00 PM",
        available_subjects: ["Rural Development", "Women Empowerment", "Tamil", "English"],
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]

    setStations(prevStations => [...prevStations, ...additionalStations])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading learning stations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Classless</h1>
            </Link>
            <div className="flex items-center space-x-2 ml-4">
              <MapPin className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">Learning Stations</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Learning Stations</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search for learning stations near you and apply to host a session.
          </p>
          {userLocation && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Navigation className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Your location: {userLocation}</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Community Learning Stations</h2>
              <p className="text-gray-600 text-center max-w-2xl mx-auto mb-6">
                Search for community learning stations in your city across India (eg: Chennai, Mumbai, Delhi, Bangalore, Hyderabad, Kolkata, Ahmedabad, Pune, Jaipur, Lucknow, Chandigarh, Kochi).
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search community learning stations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Response Section */}
        {showAIResponse && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-900">AI Answer for: "{searchQuery}"</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAI ? (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Getting answer...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 Want more detailed help? Visit a learning station near you for personalized tutoring!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class Request Section */}
        {showClassRequest && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg text-orange-900">Request a Class for: "{searchQuery}"</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-orange-800">
                  Great question! Instead of a quick answer, let's organize a proper class session to help you learn this topic thoroughly.
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-3">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Structured learning session with a qualified teacher</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Interactive examples and practice problems</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Personalized attention and doubt clearing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Certificate of completion</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule a Class
                  </Button>
                  <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find Nearby Teachers
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowClassRequest(false)
                      setSearchQuery("")
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close
                  </Button>
                </div>

                <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                  <p className="font-medium">💡 Tip:</p>
                  <p>Search for specific locations (like "Chandigarh" or "Ludhiana") to find existing learning stations, or request a class for topics you want to learn!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredStations.map((station) => (
            <Card key={station.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{station.name}</CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{station.location}</span>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(station)}>{getStatusText(station)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Operating Hours */}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{station.operating_hours}</span>
                </div>

                {/* Contact */}
                {station.contact_person && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{station.contact_person}</span>
                    </div>
                    {station.contact_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{station.contact_phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Available Subjects */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Available Subjects:</p>
                  <div className="flex flex-wrap gap-1">
                    {station.available_subjects.map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Link href={`/stations/${station.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      View Details
                    </Button>
                  </Link>
                  {station.is_active && (
                    <Link href={`/kiosk?station_id=${station.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        Start Session
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStations.length === 0 && !showAIResponse && searchQuery && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found for "{searchQuery}"</h3>
              <p className="text-gray-600 mb-4">
                No learning stations match your search. Try searching for a different location or ask a topic question
                to get an AI answer.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                }}
                className="bg-transparent"
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More Venues Button */}
        <div className="text-center mt-8 mb-8">
          <Button
            variant="outline"
            onClick={loadMoreVenues}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Load More Venues
          </Button>
        </div>

        {/* How it Works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Community Learning Stations Work</CardTitle>
            <CardDescription>Everything you need to know about using Classless at community stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Find a Station</h4>
                <p className="text-sm text-gray-600">Locate the nearest community learning station using our finder</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Check In</h4>
                <p className="text-sm text-gray-600">
                  Register at the station with your phone number or create an account
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Start Learning</h4>
                <p className="text-sm text-gray-600">Access AI tutoring, ask questions, and learn with others</p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">4. Track Progress</h4>
                <p className="text-sm text-gray-600">Your learning progress is saved and accessible from any station</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Requirements */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Want to Host a Learning Station?</CardTitle>
            <CardDescription>Help bring Classless to your community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Requirements:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Computer or tablet with internet connection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Dedicated space for students</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Volunteer or staff member for supervision</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Regular operating hours (minimum 4 hours/day)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">We Provide:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Free access to Classless platform</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Training for station coordinators</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Technical support and maintenance</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Educational materials and resources</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <Button 
                onClick={() => setShowStationApplication(true)}
                className="w-full sm:w-auto"
              >
                Apply to Host a Station
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Station Application Form Modal */}
        {showStationApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Apply to Host a Learning Station</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStationApplication(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleStationApplicationSubmit} className="space-y-8">
                  {/* 1. Applicant Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Applicant Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={stationApplication.fullName}
                          onChange={(e) => handleStationApplicationChange("fullName", e.target.value)}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={stationApplication.email}
                          onChange={(e) => handleStationApplicationChange("email", e.target.value)}
                          required
                          placeholder="Enter your email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={stationApplication.phone}
                          onChange={(e) => handleStationApplicationChange("phone", e.target.value)}
                          required
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="organization">Organization/Community Name (Optional)</Label>
                        <Input
                          id="organization"
                          type="text"
                          value={stationApplication.organization}
                          onChange={(e) => handleStationApplicationChange("organization", e.target.value)}
                          placeholder="Enter organization name if applicable"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Station Setup */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Station Setup</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="location">Location/Address *</Label>
                        <Textarea
                          id="location"
                          value={stationApplication.location}
                          onChange={(e) => handleStationApplicationChange("location", e.target.value)}
                          required
                          placeholder="Enter the full address where the station will be located"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="spaceCapacity">Space for Students *</Label>
                        <Select
                          value={stationApplication.spaceCapacity}
                          onValueChange={(value) => handleStationApplicationChange("spaceCapacity", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select capacity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (&lt; 10 students)</SelectItem>
                            <SelectItem value="medium">Medium (10-30 students)</SelectItem>
                            <SelectItem value="large">Large (30+ students)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Available Devices *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="computer"
                              checked={stationApplication.availableDevices.computer}
                              onChange={() => handleStationApplicationChange("availableDevices", "computer")}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="computer" className="text-sm">Computer</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="tablet"
                              checked={stationApplication.availableDevices.tablet}
                              onChange={() => handleStationApplicationChange("availableDevices", "tablet")}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="tablet" className="text-sm">Tablet</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="internet"
                              checked={stationApplication.availableDevices.internet}
                              onChange={() => handleStationApplicationChange("availableDevices", "internet")}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="internet" className="text-sm">Internet</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="other"
                              checked={stationApplication.availableDevices.other}
                              onChange={() => handleStationApplicationChange("availableDevices", "other")}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="other" className="text-sm">Other</Label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="operatingHours">Operating Hours *</Label>
                        <Input
                          id="operatingHours"
                          type="text"
                          value={stationApplication.operatingHours}
                          onChange={(e) => handleStationApplicationChange("operatingHours", e.target.value)}
                          required
                          placeholder="e.g., 9:00 AM - 5:00 PM, Monday to Friday"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Staffing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Staffing</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Volunteers/Staff Available? *</Label>
                        <div className="flex space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hasStaffYes"
                              name="hasStaff"
                              checked={stationApplication.hasStaff === true}
                              onChange={() => handleStationApplicationChange("hasStaff", true)}
                              className="rounded-full border-gray-300"
                            />
                            <Label htmlFor="hasStaffYes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hasStaffNo"
                              name="hasStaff"
                              checked={stationApplication.hasStaff === false}
                              onChange={() => handleStationApplicationChange("hasStaff", false)}
                              className="rounded-full border-gray-300"
                            />
                            <Label htmlFor="hasStaffNo">No</Label>
                          </div>
                        </div>
                      </div>
                      {stationApplication.hasStaff && (
                        <div>
                          <Label htmlFor="staffCount">How many? *</Label>
                          <Input
                            id="staffCount"
                            type="number"
                            min="1"
                            value={stationApplication.staffCount}
                            onChange={(e) => handleStationApplicationChange("staffCount", parseInt(e.target.value))}
                            required
                            placeholder="Enter number of staff/volunteers"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Agreement */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">4. Agreement</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="canOperate4Hours"
                          checked={stationApplication.canOperate4Hours}
                          onChange={(e) => handleStationApplicationChange("canOperate4Hours", e.target.checked)}
                          className="rounded border-gray-300 mt-1"
                          required
                        />
                        <Label htmlFor="canOperate4Hours" className="text-sm leading-relaxed">
                          I can operate at least 4 hours/day
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="agreeToGuidelines"
                          checked={stationApplication.agreeToGuidelines}
                          onChange={(e) => handleStationApplicationChange("agreeToGuidelines", e.target.checked)}
                          className="rounded border-gray-300 mt-1"
                          required
                        />
                        <Label htmlFor="agreeToGuidelines" className="text-sm leading-relaxed">
                          I agree to follow Classless guidelines
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1">
                      Submit Application
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowStationApplication(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {applicationSubmitted && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
              <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for applying! Our team will review your application and contact you soon.
              </p>
              <Button onClick={() => setApplicationSubmitted(false)}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
