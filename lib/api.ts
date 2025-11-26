import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_TODO_URL, 
  headers: {
    "Content-Type": "application/json",
  },
});
