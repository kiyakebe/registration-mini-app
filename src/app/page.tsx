"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  query,
  where,
  getDocs,
  Firestore,
} from "firebase/firestore";
import { initFirebase } from "@/firabase/clientApp";

// Define the form schema with Zod
const formSchema = z.object({
  phoneNumber: z
    .string()
    .length(10, {
      message: "Phone number must be exactly 10 characters long.",
    })
    .regex(/^(07|09)\d{8}$/, {
      message:
        "Invalid phone number format. It must start with 07 or 09 and contain only numbers.",
    }),
});

export default function page() {
  const [isLoading, setIsLoading] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeFirebase = async () => {
      const { db } = await initFirebase();
      setDb(db);
    };
    initializeFirebase();
  }, []);

  // Initialize the form with React Hook Form and Zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      if (db) {
        // console.log("Form Input:", values.phoneNumber);
        const usersRef = collection(db, "registration-mini-app-db");
        const q = query(
          usersRef,
          where("phone_number", "==", values.phoneNumber.trim())
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            console.log("Document found:", doc.data());
          });
          console.log("success")
        } else {
          console.log("No matching documents found.");
        }

        setIsLoading(false);
      } else {
        setIsLoading(false);

      }
    } catch (error) {
      setIsLoading(false);

      // console.log("Error:", error);

      console.log("Error:", error)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Register Phone Number</CardTitle>
          <CardDescription>
            Enter your phone number to register.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Checking..." : "Check Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
