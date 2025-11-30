"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.name?.toString().trim();
    if (!name) return;
    setForm({ ...form, [name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = { username: form.username, password: form.password };
      console.log("Submitting login with:", payload);
      const response = await api.post("/auth/login", payload);

      const token =
        response?.data?.token ||
        response?.data?.accessToken ||
        (response?.data?.data && response.data.data.token);

      if (token) {
        sessionStorage.setItem("token", token);
        setMessage("Logged in successfully");
        setMessageType("success");
        setLoading(false);
        router.push("/dashboard");
        return;
      } else {
        const info = response?.data?.message || "Login successful";
        setMessage(info);
        setMessageType("success");
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed";
      setMessage(errMsg);
      setMessageType("error");
      console.error("Login error:", err);
    }

    setLoading(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe123"
                  required
                  value={form.username}
                  onChange={handleChange}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center">
                      <Spinner className="mr-2" />
                      Logging in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/auth/signup">Sign up</a>
                </FieldDescription>
              </Field>
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
    </div>
  );
}
