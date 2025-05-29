'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import VisitsList from "@/components/dashboard/VisitsList";

export default function UserVisits() {
    return (
        <Card className="col-span-2">
            <CardHeader className="pb-3">
                <CardTitle>
                    Twoje wizyty
                </CardTitle>
                <CardDescription>
                    Zobacz swoje nadchodzące i minione wizyty
                </CardDescription>
            </CardHeader>
            <CardContent>
                <VisitsList />
            </CardContent>
        </Card>
    );
}
