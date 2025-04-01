import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export default function UserVisits() {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>
                    Your visits
                </CardTitle>
                <CardDescription>
                    View your upcoming and past visits
                </CardDescription>
            </CardHeader>
            <CardContent>
                test
            </CardContent>
        </Card>
    )
}
