"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createLeague } from "@/app/actions/leagues";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormValues = z.infer<typeof schema>;

export function CreateLeagueForm() {
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createLeague(values.name);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Create league
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new league</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>League name</FormLabel>
                  <FormControl>
                    <Input placeholder="Office World Cup 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating..." : "Create league"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
