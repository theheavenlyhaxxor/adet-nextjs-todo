"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";
// import { Router } from "next/router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.name?.toString().trim();
    if (!name) return; // ignore inputs without a name to avoid empty keys

    setForm({
      ...form,
      [name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Ensure passwords match before calling the API
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      console.log(process.env.BACKEND_API);
      const payload = { username: form.username, password: form.password };
      console.log("Submitting signup form with data:", payload);
      const response = await api.post("/auth/signup", payload);
      const successMsg =
        response?.data?.message || "Account created Successfully";
      setMessage(successMsg);
      setMessageType("success");
      console.log("Signup successful:", response.data);
      // router.push('auth/login')
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Signup failed";
      setMessage(errMsg);
      setMessageType("error");
      console.error("Signup error:", err);
    }

    setLoading(false);
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                value={form.username}
                onChange={handleChange}
                id="username"
                type="text"
                placeholder="johndoe123"
                required
                name="username"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                name="password"
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                name="confirmPassword"
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center">
                      <Spinner className="mr-2" />
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/auth/login">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
        {message ? (
          messageType === "success" ? (
            <Alert className="mt-3">
              <CheckCircle2Icon />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="mt-3">
              <AlertCircleIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
