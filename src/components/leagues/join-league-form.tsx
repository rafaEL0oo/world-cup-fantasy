"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { joinLeague } from "@/app/actions/leagues";
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
import { Users } from "lucide-react";

const schema = z.object({
  inviteCode: z.string().min(4, "Enter a valid invite code"),
});

type FormValues = z.infer<typeof schema>;

export function JoinLeagueForm() {
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { inviteCode: "" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await joinLeague(values.inviteCode);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Users className="size-4" />
            Join league
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join with invite code</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC123"
                      className="uppercase"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Joining..." : "Join league"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
