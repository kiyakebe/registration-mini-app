"use client";

import { useEffect, useState } from "react";

// Extend the Window interface to include the Telegram property
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

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
import {
  collection,
  query,
  where,
  getDocs,
  Firestore,
  updateDoc,
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
  const [displayData, setDisplayData] = useState("");
  const [db, setDb] = useState<Firestore | null>(null);
  const [telegramId, setTelegramId] = useState("");

  useEffect(() => {
    const initializeFirebase = async () => {
      const { db } = await initFirebase();
      setDb(db);
    };
    initializeFirebase();

    //  telegram integration
    if (typeof window !== "undefined" && window?.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const telegramId = tg.initDataUnsafe?.user?.id;
      setTelegramId(telegramId);
    } else {
      console.warn("Telegram WebApp is not available.");
    }
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
          querySnapshot.forEach(async (doc) => {
            const data = doc.data();
            if (!data.telegram_id && telegramId) {
              await updateDoc(doc.ref, { telegram_id: telegramId });
            }
          });
          console.log("userid:", telegramId);
          setDisplayData("You have already registered");
        } else {
          setDisplayData(
            "You haven't registered <br/> Please contact: 0909090909"
          );

          // console.log("No matching documents found.");
        }

        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      setDisplayData("An error occured! PLease try again later");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="space-y-6">
        {displayData && (
          <Card className="p-6 bg-gray-800 text-white">
            <h2
              className="text-sl"
              dangerouslySetInnerHTML={{ __html: displayData }}
            ></h2>
          </Card>
        )}
        <Card className="w-[350px] bg-gray-800 text-white">
          <CardHeader>
            <CardTitle>Register Phone Number</CardTitle>
            <CardDescription>
              Enter your phone number to register.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          {...field}
                          className="bg-gray-700 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Checking..." : "Check Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
