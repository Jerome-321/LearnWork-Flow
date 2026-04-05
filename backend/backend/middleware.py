class TestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print("TestMiddleware: Processing request to", request.path)
        response = self.get_response(request)
        response['X-Test-Header'] = 'TestMiddlewareExecuted'
        print("TestMiddleware: Adding header to response")
        return response