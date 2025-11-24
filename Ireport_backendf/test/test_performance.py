import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

class TestPerformance:
    """Performance testing suite"""
    
    def test_api_response_times(self, client, auth_headers):
        """Test API endpoint response times under normal load"""
        
        endpoints = [
            ("/incidents/", "GET"),
            ("/users/profile", "GET"),
            ("/admin/dashboard", "GET")
        ]
        
        response_times = {}
        
        for endpoint, method in endpoints:
            times = []
            
            # Perform 10 requests to each endpoint
            for _ in range(10):
                start_time = time.time()
                
                if method == "GET":
                    response = client.get(endpoint, headers=auth_headers)
                
                end_time = time.time()
                response_time = (end_time - start_time) * 1000  # Convert to ms
                
                assert response.status_code in [200, 201]
                times.append(response_time)
            
            response_times[endpoint] = {
                "average": statistics.mean(times),
                "median": statistics.median(times),
                "max": max(times),
                "min": min(times)
            }
        
        # Assert performance benchmarks
        assert response_times["/incidents/"]["average"] < 500  # 500ms threshold
        assert response_times["/users/profile"]["average"] < 200  # 200ms threshold
        assert response_times["/admin/dashboard"]["average"] < 1000  # 1s threshold
    
    def test_concurrent_user_load(self, client, auth_headers):
        """Test system behavior under concurrent user load"""
        
        def make_request():
            start_time = time.time()
            response = client.get("/incidents/", headers=auth_headers)
            end_time = time.time()
            return {
                "status_code": response.status_code,
                "response_time": (end_time - start_time) * 1000,
                "success": response.status_code == 200
            }
        
        # Simulate 50 concurrent users
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(make_request) for _ in range(100)]
            results = [future.result() for future in as_completed(futures)]
        
        # Analyze results
        success_rate = sum(1 for r in results if r["success"]) / len(results)
        response_times = [r["response_time"] for r in results if r["success"]]
        
        # Performance assertions
        assert success_rate >= 0.95  # 95% success rate minimum
        assert statistics.mean(response_times) < 1000  # Average response time < 1s
        assert max(response_times) < 5000  # No request should take more than 5s