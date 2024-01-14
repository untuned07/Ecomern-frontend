import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCreateOrderMutation } from "../services/appApi";

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [alertMessage, setAlertMessage] = useState("");
    const [createOrder, { isLoading, isError, isSuccess }] = useCreateOrderMutation();
    const [country, setCountry] = useState("");
    const [address, setAddress] = useState("");
    const [paying, setPaying] = useState(false);

    async function handlePay(e) {
        e.preventDefault();
        <Alert/>
        if (!stripe || !elements || user.cart.count <= 0) return;
        setPaying(true);
        const { client_secret } = await fetch("http://localhost:8080/create-payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer {sk_test_51OXGwxSGkCG5I1geyp5DvWZoT1v9egRhXT2Z8EDZupiMcXgJF6Ess72MLqL4C34EJsNDrqicxcZAFklK0RqL88AP00ImHBZVMC}",
            },
            body: JSON.stringify({ amount: user.cart.total }),
        }).then((res) => res.json());
        const { paymentIntent } = await stripe.confirmCardPayment(client_secret, {
            payment_method: {
                card: elements.getElement(CardElement),
            },
        })
        .then(() => {
            setPaying(false);
            createOrder({ userId: user._id, cart: user.cart, address, country }).then((res) => {
                if (!isLoading && !isError) {
                    // console.log(paymentIntent)
                    // setAlertMessage(`Payment ${paymentIntent.status}`);
                    setAlertMessage("Payment Successful");
                    setTimeout(() => {
                        navigate("/orders");
                    }, 3000);
                }
            });
        })
    }

    return (
        <Col className="cart-payment-container">
            <Form onSubmit={handlePay}>
                <Row>
                    {alertMessage && <Alert>{alertMessage}</Alert>}
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" placeholder="First Name" value={user.name} disabled />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="text" placeholder="Email" value={user.email} disabled />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={7}>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
                        </Form.Group>
                    </Col>
                    <Col md={5}>
                        <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
                        </Form.Group>
                    </Col>
                </Row>
                <label htmlFor="card-element">Card</label>
                <CardElement id="card-element" />
                <Button className="mt-3" type="submit" disabled={user.cart.count <= 0 || paying || isSuccess}>
                    {paying ? "Processing..." : "Checkout"}
                </Button>
            </Form>
        </Col>
    );
}

export default CheckoutForm;
